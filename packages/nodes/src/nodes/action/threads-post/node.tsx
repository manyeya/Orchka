"use client"

import { MessageCircle } from "lucide-react"
import { CredentialType } from "@orchka/credentials-core/types"
import { createSocialNode } from "../social-common/base-social-node"
import { textPostSchema } from "../social-common/types"

export const ThreadsPostNode = createSocialNode({
    schema: textPostSchema,
    credentialType: CredentialType.THREADS,
    icon: MessageCircle,
    title: "Threads Post",
    description: "Publish a text post to Threads",
    summaryField: "text",
    defaultData: { name: "Threads Post", text: "", authType: "credential" },
    fields: [
        { name: "name", label: "Name", placeholder: "Threads Post" },
        { name: "text", label: "Text", type: "textarea", placeholder: "What do you want to publish?" },
    ],
})
