"use client"

import { Facebook } from "lucide-react"
import { CredentialType } from "@orchka/credentials-core/types"
import { createSocialNode } from "../social-common/base-social-node"
import { facebookPostSchema } from "../social-common/types"

export const FacebookPostNode = createSocialNode({
    schema: facebookPostSchema,
    credentialType: CredentialType.FACEBOOK_PAGE,
    icon: Facebook,
    title: "Facebook Page Post",
    description: "Publish a text or link post to a Facebook Page",
    summaryField: "text",
    defaultData: { name: "Facebook Page Post", text: "", pageId: "", link: "", authType: "credential" },
    fields: [
        { name: "name", label: "Name", placeholder: "Facebook Page Post" },
        { name: "pageId", label: "Page ID", placeholder: "1234567890" },
        { name: "text", label: "Message", type: "textarea", placeholder: "What do you want to publish?" },
        { name: "link", label: "Link", type: "url", placeholder: "Optional URL to attach" },
    ],
})
