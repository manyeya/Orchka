"use client"

import { Pin } from "lucide-react"
import { CredentialType } from "@orchka/credentials-core/types"
import { createSocialNode } from "../social-common/base-social-node"
import { pinterestPinSchema } from "../social-common/types"

export const PinterestPinNode = createSocialNode({
    schema: pinterestPinSchema,
    credentialType: CredentialType.PINTEREST,
    icon: Pin,
    title: "Pinterest Pin",
    description: "Create a Pinterest pin from an image URL",
    summaryField: "title",
    defaultData: { name: "Pinterest Pin", boardId: "", imageUrl: "", title: "", description: "", link: "", authType: "credential" },
    fields: [
        { name: "name", label: "Name", placeholder: "Pinterest Pin" },
        { name: "boardId", label: "Board ID", placeholder: "1234567890" },
        { name: "imageUrl", label: "Image URL", type: "url", placeholder: "https://example.com/image.jpg" },
        { name: "title", label: "Title", placeholder: "Optional pin title" },
        { name: "description", label: "Description", type: "textarea", placeholder: "Optional pin description" },
        { name: "link", label: "Link", type: "url", placeholder: "Optional destination URL" },
    ],
})
