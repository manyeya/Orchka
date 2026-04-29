import ky from "ky"
import { NodeType } from "../../../core/types"
import { publishNodeStatus } from "../../utils/realtime"
import type { NodeExecutor, WorkflowContext } from "../../utils/execution/types"
import type { DiscordMessageSettings } from "../social-common/types"
import { formatApiError, parseJsonResponse, resolveDiscordWebhook } from "../social-common/executor-utils"

export const discordMessageExecutor: NodeExecutor<DiscordMessageSettings> = async ({ data, nodeId, context, publish, resolveCredential }): Promise<WorkflowContext> => {
    await publishNodeStatus(publish, nodeId, "loading", NodeType.DISCORD_MESSAGE)
    try {
        const webhookUrl = await resolveDiscordWebhook(data, resolveCredential)
        const response = await ky.post(webhookUrl, {
            searchParams: { wait: "true" },
            json: { content: data.content, ...(data.username ? { username: data.username } : {}) },
            throwHttpErrors: false,
        })
        const payload = await parseJsonResponse<Record<string, unknown>>(response)
        if (!response.ok) throw new Error(formatApiError("Discord", response.status, payload))
        await publishNodeStatus(publish, nodeId, "success", NodeType.DISCORD_MESSAGE)
        return { ...context, [data.name || "Discord Message"]: { id: payload.id, platform: "discord", response: payload } }
    } catch (error) {
        await publishNodeStatus(publish, nodeId, "error", NodeType.DISCORD_MESSAGE)
        throw error
    }
}
