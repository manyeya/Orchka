import ky from "ky"
import { CredentialType } from "@orchka/credentials-core"
import { NonRetriableError } from "@orchka/nodes/core"
import { NodeType } from "../../../core/types"
import { publishNodeStatus } from "../../utils/realtime"
import type { NodeExecutor, WorkflowContext } from "../../utils/execution/types"
import type { FacebookPostSettings } from "../social-common/types"
import { formatApiError, parseJsonResponse, resolveFacebookPageToken } from "../social-common/executor-utils"

export const facebookPostExecutor: NodeExecutor<FacebookPostSettings> = async ({ data, nodeId, context, publish, resolveCredential }): Promise<WorkflowContext> => {
    await publishNodeStatus(publish, nodeId, "loading", NodeType.FACEBOOK_POST)
    try {
        if (!data.pageId || !data.text) throw new NonRetriableError("Facebook Page ID and message are required")
        const accessToken = await resolveFacebookPageToken(data, resolveCredential)
        const response = await ky.post(`https://graph.facebook.com/v21.0/${data.pageId}/feed`, {
            json: { message: data.text, ...(data.link ? { link: data.link } : {}), access_token: accessToken },
            throwHttpErrors: false,
        })
        const payload = await parseJsonResponse<Record<string, unknown>>(response)
        if (!response.ok) throw new NonRetriableError(formatApiError("Facebook", response.status, payload))
        await publishNodeStatus(publish, nodeId, "success", NodeType.FACEBOOK_POST)
        return { ...context, [data.name || "Facebook Page Post"]: { id: payload.id, platform: "facebook", response: payload } }
    } catch (error) {
        await publishNodeStatus(publish, nodeId, "error", NodeType.FACEBOOK_POST)
        throw error
    }
}
