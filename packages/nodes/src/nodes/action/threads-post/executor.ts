import ky from "ky"
import { CredentialType } from "@orchka/credentials-core"
import { NonRetriableError } from "@orchka/nodes/core"
import { NodeType } from "../../../core/types"
import { publishNodeStatus } from "../../utils/realtime"
import type { NodeExecutor, WorkflowContext } from "../../utils/execution/types"
import type { TextPostSettings } from "../social-common/types"
import { formatApiError, parseJsonResponse, resolveAccessToken } from "../social-common/executor-utils"

export const threadsPostExecutor: NodeExecutor<TextPostSettings> = async ({ data, nodeId, context, publish, resolveCredential }): Promise<WorkflowContext> => {
    await publishNodeStatus(publish, nodeId, "loading", NodeType.THREADS_POST)
    try {
        if (!data.text) throw new NonRetriableError("Threads text is required")
        const accessToken = await resolveAccessToken("Threads", CredentialType.THREADS, data, resolveCredential)
        const createResponse = await ky.post("https://graph.threads.net/v1.0/me/threads", {
            json: { media_type: "TEXT", text: data.text, access_token: accessToken },
            throwHttpErrors: false,
        })
        const createPayload = await parseJsonResponse<Record<string, unknown>>(createResponse)
        if (!createResponse.ok || !createPayload.id) throw new NonRetriableError(formatApiError("Threads", createResponse.status, createPayload))
        const publishResponse = await ky.post("https://graph.threads.net/v1.0/me/threads_publish", {
            json: { creation_id: createPayload.id, access_token: accessToken },
            throwHttpErrors: false,
        })
        const payload = await parseJsonResponse<Record<string, unknown>>(publishResponse)
        if (!publishResponse.ok) throw new NonRetriableError(formatApiError("Threads", publishResponse.status, payload))
        await publishNodeStatus(publish, nodeId, "success", NodeType.THREADS_POST)
        return { ...context, [data.name || "Threads Post"]: { id: payload.id, platform: "threads", response: payload } }
    } catch (error) {
        await publishNodeStatus(publish, nodeId, "error", NodeType.THREADS_POST)
        throw error
    }
}
