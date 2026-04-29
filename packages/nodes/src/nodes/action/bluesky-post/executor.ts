import ky from "ky"
import { NonRetriableError } from "@orchka/nodes/core"
import { NodeType } from "../../../core/types"
import { publishNodeStatus } from "../../utils/realtime"
import type { NodeExecutor, WorkflowContext } from "../../utils/execution/types"
import type { BlueskyPostSettings } from "../social-common/types"
import { createBlueskySession, formatApiError, parseJsonResponse } from "../social-common/executor-utils"

export const blueskyPostExecutor: NodeExecutor<BlueskyPostSettings> = async ({ data, nodeId, context, publish, resolveCredential }): Promise<WorkflowContext> => {
    await publishNodeStatus(publish, nodeId, "loading", NodeType.BLUESKY_POST)
    try {
        if (!data.text) throw new NonRetriableError("Bluesky text is required")
        const session = await createBlueskySession(data, resolveCredential)
        const response = await ky.post(`${session.serviceUrl.replace(/\/$/, "")}/xrpc/com.atproto.repo.createRecord`, {
            headers: { Authorization: `Bearer ${session.accessJwt}` },
            json: {
                repo: session.did,
                collection: "app.bsky.feed.post",
                record: { "$type": "app.bsky.feed.post", text: data.text, createdAt: new Date().toISOString() },
            },
            throwHttpErrors: false,
        })
        const payload = await parseJsonResponse<Record<string, unknown>>(response)
        if (!response.ok) throw new NonRetriableError(formatApiError("Bluesky", response.status, payload))
        await publishNodeStatus(publish, nodeId, "success", NodeType.BLUESKY_POST)
        return { ...context, [data.name || "Bluesky Post"]: { uri: payload.uri, cid: payload.cid, platform: "bluesky", response: payload } }
    } catch (error) {
        await publishNodeStatus(publish, nodeId, "error", NodeType.BLUESKY_POST)
        throw error
    }
}
