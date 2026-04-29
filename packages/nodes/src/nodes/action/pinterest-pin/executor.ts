import ky from "ky"
import { CredentialType } from "@orchka/credentials-core"
import { NonRetriableError } from "@orchka/nodes/core"
import { NodeType } from "../../../core/types"
import { publishNodeStatus } from "../../utils/realtime"
import type { NodeExecutor, WorkflowContext } from "../../utils/execution/types"
import type { PinterestPinSettings } from "../social-common/types"
import { formatApiError, parseJsonResponse, resolveAccessToken } from "../social-common/executor-utils"

export const pinterestPinExecutor: NodeExecutor<PinterestPinSettings> = async ({ data, nodeId, context, publish, resolveCredential }): Promise<WorkflowContext> => {
    await publishNodeStatus(publish, nodeId, "loading", NodeType.PINTEREST_PIN)
    try {
        if (!data.boardId || !data.imageUrl) throw new NonRetriableError("Pinterest board ID and image URL are required")
        const accessToken = await resolveAccessToken("Pinterest", CredentialType.PINTEREST, data, resolveCredential)
        const response = await ky.post("https://api.pinterest.com/v5/pins", {
            headers: { Authorization: `Bearer ${accessToken}` },
            json: {
                board_id: data.boardId,
                title: data.title || undefined,
                description: data.description || undefined,
                link: data.link || undefined,
                media_source: { source_type: "image_url", url: data.imageUrl },
            },
            throwHttpErrors: false,
        })
        const payload = await parseJsonResponse<Record<string, unknown>>(response)
        if (!response.ok) throw new NonRetriableError(formatApiError("Pinterest", response.status, payload))
        await publishNodeStatus(publish, nodeId, "success", NodeType.PINTEREST_PIN)
        return { ...context, [data.name || "Pinterest Pin"]: { id: payload.id, platform: "pinterest", response: payload } }
    } catch (error) {
        await publishNodeStatus(publish, nodeId, "error", NodeType.PINTEREST_PIN)
        throw error
    }
}
