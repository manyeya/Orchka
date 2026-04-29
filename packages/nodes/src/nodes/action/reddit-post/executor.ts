import ky from "ky"
import { CredentialType } from "@orchka/credentials-core"
import { NonRetriableError } from "@orchka/nodes/core"
import { NodeType } from "../../../core/types"
import { publishNodeStatus } from "../../utils/realtime"
import type { NodeExecutor, WorkflowContext } from "../../utils/execution/types"
import type { RedditPostSettings } from "../social-common/types"
import { formatApiError, parseJsonResponse, resolveAccessToken } from "../social-common/executor-utils"

export const redditPostExecutor: NodeExecutor<RedditPostSettings> = async ({ data, nodeId, context, publish, resolveCredential }): Promise<WorkflowContext> => {
    await publishNodeStatus(publish, nodeId, "loading", NodeType.REDDIT_POST)
    try {
        if (!data.subreddit || !data.title) throw new NonRetriableError("Subreddit and title are required")
        if (data.kind === "link" && !data.url) throw new NonRetriableError("URL is required for Reddit link posts")
        const accessToken = await resolveAccessToken("Reddit", CredentialType.REDDIT, data, resolveCredential)
        const form = new URLSearchParams({
            api_type: "json",
            sr: data.subreddit,
            title: data.title,
            kind: data.kind || "self",
            ...(data.kind === "link" ? { url: data.url || "" } : { text: data.text || "" }),
        })
        const response = await ky.post("https://oauth.reddit.com/api/submit", {
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/x-www-form-urlencoded" },
            body: form,
            throwHttpErrors: false,
        })
        const payload = await parseJsonResponse<Record<string, unknown>>(response)
        if (!response.ok) throw new NonRetriableError(formatApiError("Reddit", response.status, payload))
        await publishNodeStatus(publish, nodeId, "success", NodeType.REDDIT_POST)
        return { ...context, [data.name || "Reddit Post"]: { platform: "reddit", response: payload } }
    } catch (error) {
        await publishNodeStatus(publish, nodeId, "error", NodeType.REDDIT_POST)
        throw error
    }
}
