"use client"

import { Instagram } from "lucide-react"
import { CredentialType } from "@orchka/credentials-core/types"
import { createSocialNode } from "../social-common/base-social-node"
import { instagramPostSchema } from "../social-common/types"

export const InstagramPostNode = createSocialNode({
    schema: instagramPostSchema,
    credentialType: CredentialType.INSTAGRAM,
    icon: Instagram,
    title: "Instagram Post",
    description: "Publish an image post with an optional caption",
    summaryField: "caption",
    defaultData: { name: "Instagram Post", instagramUserId: "", imageUrl: "", caption: "", authType: "credential" },
    fields: [
        { name: "name", label: "Name", placeholder: "Instagram Post" },
        { name: "instagramUserId", label: "Instagram User ID", placeholder: "17841400000000000" },
        { name: "imageUrl", label: "Image URL", type: "url", placeholder: "https://example.com/image.jpg" },
        { name: "caption", label: "Caption", type: "textarea", placeholder: "Caption text" },
    ],
})
