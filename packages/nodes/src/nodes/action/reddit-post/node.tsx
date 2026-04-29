"use client"

import { MessageCircleMore } from "lucide-react"
import { CredentialType } from "@orchka/credentials-core/types"
import { createSocialNode } from "../social-common/base-social-node"
import { redditPostSchema } from "../social-common/types"

export const RedditPostNode = createSocialNode({
    schema: redditPostSchema,
    credentialType: CredentialType.REDDIT,
    icon: MessageCircleMore,
    title: "Reddit Post",
    description: "Submit a text or link post to a subreddit",
    summaryField: "title",
    defaultData: { name: "Reddit Post", text: "", subreddit: "", title: "", kind: "self", url: "", authType: "credential" },
    fields: [
        { name: "name", label: "Name", placeholder: "Reddit Post" },
        { name: "subreddit", label: "Subreddit", placeholder: "automation" },
        { name: "title", label: "Title", placeholder: "Post title" },
        { name: "kind", label: "Post Type", type: "select", options: [{ value: "self", label: "Text" }, { value: "link", label: "Link" }] },
        { name: "text", label: "Text", type: "textarea", placeholder: "Text post body" },
        { name: "url", label: "URL", type: "url", placeholder: "Required for link posts" },
    ],
})
