import ky from "ky"
import {
    CredentialType,
    isLinkedInCredential,
    type DecryptedCredential,
} from "@orchka/credentials-core"
import { NonRetriableError } from "@orchka/nodes/core"

import { NodeType } from "../../../core/types"
import { publishNodeStatus } from "../../utils/realtime"
import { NodeExecutor, WorkflowContext } from "../../utils/execution/types"
import type { LinkedInPostSettings } from "./settings-form"

type LinkedInPostResponse = Record<string, unknown>

export const linkedInPostExecutor: NodeExecutor<LinkedInPostSettings> = async ({
    data,
    nodeId,
    context,
    publish,
    resolveCredential,
}): Promise<WorkflowContext> => {
    await publishNodeStatus(publish, nodeId, "loading", NodeType.LINKEDIN_POST)

    try {
        const token = await resolveBearerToken(data, resolveCredential)
        const body = buildLinkedInPostBody(data)

        const response = await ky.post("https://api.linkedin.com/rest/posts", {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                "Linkedin-Version": data.linkedinVersion || "202604",
                "X-Restli-Protocol-Version": "2.0.0",
            },
            json: body,
            timeout: 30000,
            throwHttpErrors: false,
        })

        const payload = await parseJsonResponse<LinkedInPostResponse>(response)

        if (!response.ok) {
            throw new NonRetriableError(formatApiError(response.status, payload))
        }

        await publishNodeStatus(publish, nodeId, "success", NodeType.LINKEDIN_POST)

        const nodeName = data.name || "LinkedIn Post"
        return {
            ...context,
            [nodeName]: {
                id: response.headers.get("x-restli-id") || payload.id,
                platform: "linkedin",
                response: payload,
            },
        }
    } catch (error) {
        await publishNodeStatus(publish, nodeId, "error", NodeType.LINKEDIN_POST)
        throw error
    }
}

async function resolveBearerToken(
    data: LinkedInPostSettings,
    resolveCredential?: (credentialId: string) => Promise<DecryptedCredential>,
): Promise<string> {
    if (data.authType === "bearer") {
        if (!data.accessToken) {
            throw new NonRetriableError("LinkedIn access token is required")
        }
        return data.accessToken
    }

    if (!data.credentialId || !resolveCredential) {
        throw new NonRetriableError("LinkedIn bearer token credential is required")
    }

    const credential = await resolveCredential(data.credentialId)
    if (credential.type !== CredentialType.LINKEDIN || !isLinkedInCredential(credential.data)) {
        throw new NonRetriableError("LinkedIn Post requires a LinkedIn credential")
    }

    return credential.data.accessToken
}

function buildLinkedInPostBody(data: LinkedInPostSettings): Record<string, unknown> {
    if (!data.authorUrn) {
        throw new NonRetriableError("LinkedIn author URN is required")
    }

    if (!data.commentary) {
        throw new NonRetriableError("LinkedIn post text is required")
    }

    const body: Record<string, unknown> = {
        author: data.authorUrn,
        commentary: data.commentary,
        visibility: data.visibility || "PUBLIC",
        distribution: {
            feedDistribution: "MAIN_FEED",
            targetEntities: [],
            thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: data.disableReshare || false,
    }

    if (data.articleUrl) {
        body.content = {
            article: {
                source: data.articleUrl,
                ...(data.articleTitle ? { title: data.articleTitle } : {}),
                ...(data.articleDescription ? { description: data.articleDescription } : {}),
            },
        }
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

function formatApiError(status: number, payload: LinkedInPostResponse): string {
    const message = typeof payload.message === "string"
        ? payload.message
        : typeof payload.error_description === "string"
            ? payload.error_description
            : undefined

    return `LinkedIn API request failed with status ${status}${message ? `: ${message}` : ""}`
}
