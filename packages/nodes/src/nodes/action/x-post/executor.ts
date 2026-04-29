import ky from "ky"
import {
    CredentialType,
    isXCredential,
    type DecryptedCredential,
} from "@orchka/credentials-core"
import { NonRetriableError } from "@orchka/nodes/core"

import { NodeType } from "../../../core/types"
import { publishNodeStatus } from "../../utils/realtime"
import { NodeExecutor, WorkflowContext } from "../../utils/execution/types"
import type { XPostSettings } from "./settings-form"

interface XPostResponse {
    data?: {
        id: string
        text: string
    }
    errors?: Array<{
        title?: string
        detail?: string
        status?: number
    }>
}

export const xPostExecutor: NodeExecutor<XPostSettings> = async ({
    data,
    nodeId,
    context,
    publish,
    resolveCredential,
}): Promise<WorkflowContext> => {
    await publishNodeStatus(publish, nodeId, "loading", NodeType.X_POST)

    try {
        const token = await resolveBearerToken(data, resolveCredential)
        const body = buildXPostBody(data)

        const response = await ky.post("https://api.x.com/2/tweets", {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            json: body,
            timeout: 30000,
            throwHttpErrors: false,
        })

        const payload = await parseJsonResponse<XPostResponse>(response)

        if (!response.ok) {
            throw new NonRetriableError(formatApiError("X", response.status, payload))
        }

        await publishNodeStatus(publish, nodeId, "success", NodeType.X_POST)

        const nodeName = data.name || "X Post"
        return {
            ...context,
            [nodeName]: {
                id: payload.data?.id,
                text: payload.data?.text,
                platform: "x",
                response: payload,
            },
        }
    } catch (error) {
        await publishNodeStatus(publish, nodeId, "error", NodeType.X_POST)
        throw error
    }
}

async function resolveBearerToken(
    data: XPostSettings,
    resolveCredential?: (credentialId: string) => Promise<DecryptedCredential>,
): Promise<string> {
    if (data.authType === "bearer") {
        if (!data.accessToken) {
            throw new NonRetriableError("X access token is required")
        }
        return data.accessToken
    }

    if (!data.credentialId || !resolveCredential) {
        throw new NonRetriableError("X bearer token credential is required")
    }

    const credential = await resolveCredential(data.credentialId)
    if (credential.type !== CredentialType.X || !isXCredential(credential.data)) {
        throw new NonRetriableError("X Post requires an X credential")
    }

    return credential.data.accessToken
}

function buildXPostBody(data: XPostSettings): Record<string, unknown> {
    if (!data.text) {
        throw new NonRetriableError("X post text is required")
    }

    const body: Record<string, unknown> = { text: data.text }

    if (data.quotePostId) {
        body.quote_tweet_id = data.quotePostId
    }

    if (data.replyToPostId) {
        body.reply = { in_reply_to_tweet_id: data.replyToPostId }
    }

    if (data.replySettings && data.replySettings !== "default") {
        body.reply_settings = data.replySettings
    }

    if (data.madeWithAi) {
        body.made_with_ai = true
    }

    return body
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
    try {
        return await response.json() as T
    } catch {
        return {} as T
    }
}

function formatApiError(platform: string, status: number, payload: XPostResponse): string {
    const detail = payload.errors?.[0]?.detail || payload.errors?.[0]?.title
    return `${platform} API request failed with status ${status}${detail ? `: ${detail}` : ""}`
}
