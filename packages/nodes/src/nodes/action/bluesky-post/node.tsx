"use client"

import { CloudSun } from "lucide-react"
import { CredentialType } from "@orchka/credentials-core/types"
import { createSocialNode } from "../social-common/base-social-node"
import { blueskyPostSchema } from "../social-common/types"

export const BlueskyPostNode = createSocialNode({
    schema: blueskyPostSchema,
    credentialType: CredentialType.BLUESKY,
    icon: CloudSun,
    title: "Bluesky Post",
    description: "Publish a text post to Bluesky",
    summaryField: "text",
    defaultData: { name: "Bluesky Post", text: "", serviceUrl: "https://bsky.social" },
    fields: [
        { name: "name", label: "Name", placeholder: "Bluesky Post" },
        { name: "text", label: "Text", type: "textarea", placeholder: "What do you want to publish?" },
    ],
})
