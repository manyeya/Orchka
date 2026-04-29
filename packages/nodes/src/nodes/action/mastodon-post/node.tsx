"use client"

import { RadioTower } from "lucide-react"
import { CredentialType } from "@orchka/credentials-core/types"
import { createSocialNode } from "../social-common/base-social-node"
import { mastodonPostSchema } from "../social-common/types"

export const MastodonPostNode = createSocialNode({
    schema: mastodonPostSchema,
    credentialType: CredentialType.MASTODON,
    icon: RadioTower,
    title: "Mastodon Post",
    description: "Publish a status to a Mastodon instance",
    summaryField: "text",
    defaultData: { name: "Mastodon Post", text: "", visibility: "public", contentWarning: "", authType: "credential" },
    fields: [
        { name: "name", label: "Name", placeholder: "Mastodon Post" },
        { name: "text", label: "Status", type: "textarea", placeholder: "What do you want to publish?" },
        { name: "visibility", label: "Visibility", type: "select", options: [
            { value: "public", label: "Public" },
            { value: "unlisted", label: "Unlisted" },
            { value: "private", label: "Followers Only" },
            { value: "direct", label: "Direct" },
        ] },
        { name: "contentWarning", label: "Content Warning", placeholder: "Optional content warning" },
    ],
})
