import ky from "ky"
import { NodeType } from "../../../core/types"
import { publishNodeStatus } from "../../utils/realtime"
import type { NodeExecutor, WorkflowContext } from "../../utils/execution/types"
import type { MastodonPostSettings } from "../social-common/types"
import { formatApiError, parseJsonResponse, resolveMastodonCredential } from "../social-common/executor-utils"

export const mastodonPostExecutor: NodeExecutor<MastodonPostSettings> = async ({ data, nodeId, context, publish, resolveCredential }): Promise<WorkflowContext> => {
    await publishNodeStatus(publish, nodeId, "loading", NodeType.MASTODON_POST)
    try {
        const credential = await resolveMastodonCredential(data.credentialId, resolveCredential)
        const response = await ky.post(`${credential.instanceUrl.replace(/\/$/, "")}/api/v1/statuses`, {
            headers: { Authorization: `Bearer ${credential.accessToken}` },
            json: {
                status: data.text,
                visibility: data.visibility || "public",
                ...(data.contentWarning ? { spoiler_text: data.contentWarning } : {}),
            },
            throwHttpErrors: false,
        })
        const payload = await parseJsonResponse<Record<string, unknown>>(response)
        if (!response.ok) throw new Error(formatApiError("Mastodon", response.status, payload))
        await publishNodeStatus(publish, nodeId, "success", NodeType.MASTODON_POST)
        return { ...context, [data.name || "Mastodon Post"]: { id: payload.id, url: payload.url, platform: "mastodon", response: payload } }
    } catch (error) {
        await publishNodeStatus(publish, nodeId, "error", NodeType.MASTODON_POST)
        throw error
    }
}
