"use client"

import { MessageSquare } from "lucide-react"
import { CredentialType } from "@orchka/credentials-core/types"
import { createSocialNode } from "../social-common/base-social-node"
import { discordMessageSchema } from "../social-common/types"

export const DiscordMessageNode = createSocialNode({
    schema: discordMessageSchema,
    credentialType: CredentialType.DISCORD,
    icon: MessageSquare,
    title: "Discord Message",
    description: "Send a message through a Discord webhook",
    summaryField: "content",
    defaultData: { name: "Discord Message", content: "", username: "", webhookUrl: "" },
    fields: [
        { name: "name", label: "Name", placeholder: "Discord Message" },
        { name: "content", label: "Message", type: "textarea", placeholder: "Message content" },
        { name: "username", label: "Username", placeholder: "Optional webhook username" },
    ],
})
