"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CredentialType } from "@orchka/credentials-core/types"
import { Button } from "@orchka/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@orchka/ui/form"
import { Input } from "@orchka/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@orchka/ui/select"
import { Separator } from "@orchka/ui/separator"
import { Switch } from "@orchka/ui/switch"
import { Textarea } from "@orchka/ui/textarea"
import { CredentialSelector } from "@orchka/nodes/editor"
import { Key } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const xPostSettingsSchema = z.object({
    name: z.string().min(1, "Name is required"),
    text: z.string().min(1, "Post text is required").max(4000, "Post text is too long"),
    authType: z.enum(["credential", "bearer"]).catch("credential"),
    credentialId: z.string().optional(),
    accessToken: z.string().optional(),
    quotePostId: z.string().optional(),
    replyToPostId: z.string().optional(),
    replySettings: z.enum(["default", "following", "mentionedUsers", "subscribers", "verified"]).catch("default"),
    madeWithAi: z.boolean().catch(false),
})

export type XPostSettings = z.infer<typeof xPostSettingsSchema>

interface XPostSettingsFormProps {
    defaultValues?: Partial<XPostSettings>
    onSubmit: (values: XPostSettings) => void
    onCancel?: () => void
}

export function XPostSettingsForm({ defaultValues, onSubmit, onCancel }: XPostSettingsFormProps) {
    const form = useForm<z.input<typeof xPostSettingsSchema>, unknown, XPostSettings>({
        resolver: zodResolver(xPostSettingsSchema),
        defaultValues: {
            name: "X Post",
            text: "",
            authType: "credential",
            replySettings: "default",
            madeWithAi: false,
            ...defaultValues,
        },
    })

    const authType = form.watch("authType")

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-6 pr-4">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold">X Post</h3>
                            <p className="text-sm text-muted-foreground">
                                Publish a text post, reply, or quote post using X API v2
                            </p>
                        </div>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="X Post" {...field} />
                                    </FormControl>
                                    <FormDescription>A unique name for this node in the workflow</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="text"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Post Text</FormLabel>
                                    <FormControl>
                                        <Textarea className="min-h-[160px]" placeholder="What do you want to publish?" {...field} />
                                    </FormControl>
                                    <FormDescription>Expressions are resolved before this node runs</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="authType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Authentication</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select authentication" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="credential">Stored Bearer Token</SelectItem>
                                            <SelectItem value="bearer">Bearer Token</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {authType === "credential" && (
                            <FormField
                                control={form.control}
                                name="credentialId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Key className="h-4 w-4" />
                                            Credential
                                        </FormLabel>
                                        <FormControl>
                                            <CredentialSelector
                                                type={CredentialType.X}
                                                value={field.value}
                                                onChange={(config) => field.onChange(config?.credentialId)}
                                                placeholder="Select an X credential..."
                                            />
                                        </FormControl>
                                        <FormDescription>Requires an OAuth user token with post write access</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {authType === "bearer" && (
                            <FormField
                                control={form.control}
                                name="accessToken"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bearer Token</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="Enter X user access token" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="quotePostId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quote Post ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Optional X post ID to quote" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="replyToPostId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reply To Post ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Optional X post ID to reply to" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="replySettings"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reply Settings</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Who can reply?" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="default">Platform Default</SelectItem>
                                            <SelectItem value="following">Following</SelectItem>
                                            <SelectItem value="mentionedUsers">Mentioned Users</SelectItem>
                                            <SelectItem value="subscribers">Subscribers</SelectItem>
                                            <SelectItem value="verified">Verified</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="madeWithAi"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Made with AI</FormLabel>
                                        <FormDescription>Tell X to label AI-generated media when applicable</FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />
                <div className="flex justify-end gap-3 pr-4">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit">Save Settings</Button>
                </div>
            </form>
        </Form>
    )
}
