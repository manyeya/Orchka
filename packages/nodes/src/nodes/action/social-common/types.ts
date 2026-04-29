import * as z from "zod"

export const authModeSchema = z.enum(["credential", "token"]).catch("credential")

export const textPostSchema = z.object({
    name: z.string().min(1, "Name is required"),
    text: z.string().min(1, "Text is required"),
    authType: authModeSchema,
    credentialId: z.string().optional(),
    accessToken: z.string().optional(),
})

export type TextPostSettings = z.infer<typeof textPostSchema>

export const facebookPostSchema = textPostSchema.extend({
    pageId: z.string().min(1, "Page ID is required"),
    link: z.string().url("Enter a valid URL").optional().or(z.literal("")),
})

export type FacebookPostSettings = z.infer<typeof facebookPostSchema>

export const instagramPostSchema = z.object({
    name: z.string().min(1, "Name is required"),
    instagramUserId: z.string().min(1, "Instagram user ID is required"),
    imageUrl: z.string().url("Enter a valid image URL"),
    caption: z.string().optional(),
    authType: authModeSchema,
    credentialId: z.string().optional(),
    accessToken: z.string().optional(),
})

export type InstagramPostSettings = z.infer<typeof instagramPostSchema>

export const redditPostSchema = textPostSchema.extend({
    subreddit: z.string().min(1, "Subreddit is required"),
    title: z.string().min(1, "Title is required"),
    kind: z.enum(["self", "link"]).catch("self"),
    url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
})

export type RedditPostSettings = z.infer<typeof redditPostSchema>

export const mastodonPostSchema = textPostSchema.extend({
    visibility: z.enum(["public", "unlisted", "private", "direct"]).catch("public"),
    contentWarning: z.string().optional(),
})

export type MastodonPostSettings = z.infer<typeof mastodonPostSchema>

export const pinterestPinSchema = z.object({
    name: z.string().min(1, "Name is required"),
    boardId: z.string().min(1, "Board ID is required"),
    imageUrl: z.string().url("Enter a valid image URL"),
    title: z.string().optional(),
    description: z.string().optional(),
    link: z.string().url("Enter a valid URL").optional().or(z.literal("")),
    authType: authModeSchema,
    credentialId: z.string().optional(),
    accessToken: z.string().optional(),
})

export type PinterestPinSettings = z.infer<typeof pinterestPinSchema>

export const blueskyPostSchema = z.object({
    name: z.string().min(1, "Name is required"),
    text: z.string().min(1, "Text is required"),
    credentialId: z.string().optional(),
    identifier: z.string().optional(),
    password: z.string().optional(),
    serviceUrl: z.string().url("Enter a valid service URL").optional().or(z.literal("")),
})

export type BlueskyPostSettings = z.infer<typeof blueskyPostSchema>

export const discordMessageSchema = z.object({
    name: z.string().min(1, "Name is required"),
    content: z.string().min(1, "Message content is required"),
    username: z.string().optional(),
    credentialId: z.string().optional(),
    webhookUrl: z.string().url("Enter a valid webhook URL").optional().or(z.literal("")),
})

export type DiscordMessageSettings = z.infer<typeof discordMessageSchema>
