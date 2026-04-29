import ky from "ky"
import { CredentialType } from "@orchka/credentials-core"
import { NonRetriableError } from "@orchka/nodes/core"
import { NodeType } from "../../../core/types"
import { publishNodeStatus } from "../../utils/realtime"
import type { NodeExecutor, WorkflowContext } from "../../utils/execution/types"
import type { InstagramPostSettings } from "../social-common/types"
import { formatApiError, parseJsonResponse, resolveAccessToken } from "../social-common/executor-utils"

export const instagramPostExecutor: NodeExecutor<InstagramPostSettings> = async ({ data, nodeId, context, publish, resolveCredential }): Promise<WorkflowContext> => {
    await publishNodeStatus(publish, nodeId, "loading", NodeType.INSTAGRAM_POST)
    try {
        if (!data.instagramUserId || !data.imageUrl) throw new NonRetriableError("Instagram user ID and image URL are required")
        const accessToken = await resolveAccessToken("Instagram", CredentialType.INSTAGRAM, data, resolveCredential)
        const createResponse = await ky.post(`https://graph.facebook.com/v21.0/${data.instagramUserId}/media`, {
            json: { image_url: data.imageUrl, caption: data.caption || "", access_token: accessToken },
            throwHttpErrors: false,
        })
        const createPayload = await parseJsonResponse<Record<string, unknown>>(createResponse)
        if (!createResponse.ok || !createPayload.id) throw new NonRetriableError(formatApiError("Instagram", createResponse.status, createPayload))
        const publishResponse = await ky.post(`https://graph.facebook.com/v21.0/${data.instagramUserId}/media_publish`, {
            json: { creation_id: createPayload.id, access_token: accessToken },
            throwHttpErrors: false,
        })
        const payload = await parseJsonResponse<Record<string, unknown>>(publishResponse)
        if (!publishResponse.ok) throw new NonRetriableError(formatApiError("Instagram", publishResponse.status, payload))
        await publishNodeStatus(publish, nodeId, "success", NodeType.INSTAGRAM_POST)
        return { ...context, [data.name || "Instagram Post"]: { id: payload.id, platform: "instagram", response: payload } }
    } catch (error) {
        await publishNodeStatus(publish, nodeId, "error", NodeType.INSTAGRAM_POST)
        throw error
    }
}
