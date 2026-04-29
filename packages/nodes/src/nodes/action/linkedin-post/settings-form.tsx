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
import { Textarea } from "@orchka/ui/textarea"
import { CredentialSelector } from "@orchka/nodes/editor"
import { Key } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const linkedInPostSettingsSchema = z.object({
    name: z.string().min(1, "Name is required"),
    authorUrn: z.string().min(1, "Author URN is required"),
    commentary: z.string().min(1, "Post text is required"),
    visibility: z.enum(["PUBLIC", "CONNECTIONS"]).catch("PUBLIC"),
    authType: z.enum(["credential", "bearer"]).catch("credential"),
    credentialId: z.string().optional(),
    accessToken: z.string().optional(),
    linkedinVersion: z.string().regex(/^\d{6}$/, "Use YYYYMM format").catch("202604"),
    articleUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
    articleTitle: z.string().optional(),
    articleDescription: z.string().optional(),
    disableReshare: z.boolean().catch(false),
})

export type LinkedInPostSettings = z.infer<typeof linkedInPostSettingsSchema>

interface LinkedInPostSettingsFormProps {
    defaultValues?: Partial<LinkedInPostSettings>
    onSubmit: (values: LinkedInPostSettings) => void
    onCancel?: () => void
}

export function LinkedInPostSettingsForm({ defaultValues, onSubmit, onCancel }: LinkedInPostSettingsFormProps) {
    const form = useForm<z.input<typeof linkedInPostSettingsSchema>, unknown, LinkedInPostSettings>({
        resolver: zodResolver(linkedInPostSettingsSchema),
        defaultValues: {
            name: "LinkedIn Post",
            authorUrn: "",
            commentary: "",
            visibility: "PUBLIC",
            authType: "credential",
            linkedinVersion: "202604",
            articleUrl: "",
            articleTitle: "",
            articleDescription: "",
            disableReshare: false,
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
                            <h3 className="text-lg font-semibold">LinkedIn Post</h3>
                            <p className="text-sm text-muted-foreground">
                                Publish an organic post to a member or organization feed
                            </p>
                        </div>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="LinkedIn Post" {...field} />
                                    </FormControl>
                                    <FormDescription>A unique name for this node in the workflow</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="authorUrn"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Author URN</FormLabel>
                                    <FormControl>
                                        <Input placeholder="urn:li:person:abc123 or urn:li:organization:123456" {...field} />
                                    </FormControl>
                                    <FormDescription>Use the member or organization URN the token can publish as</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="commentary"
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
                                                type={CredentialType.LINKEDIN}
                                                value={field.value}
                                                onChange={(config) => field.onChange(config?.credentialId)}
                                                placeholder="Select a LinkedIn credential..."
                                            />
                                        </FormControl>
                                        <FormDescription>Requires a token with the relevant LinkedIn social posting permission</FormDescription>
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
                                            <Input type="password" placeholder="Enter LinkedIn access token" {...field} />
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
                            name="articleUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Article URL</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Optional link to attach" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="articleTitle"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Article Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Optional article title" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="articleDescription"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Article Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Optional article description" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="visibility"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Visibility</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select visibility" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="PUBLIC">Public</SelectItem>
                                            <SelectItem value="CONNECTIONS">Connections</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="linkedinVersion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>LinkedIn API Version</FormLabel>
                                    <FormControl>
                                        <Input placeholder="202604" {...field} />
                                    </FormControl>
                                    <FormDescription>Format: YYYYMM</FormDescription>
                                    <FormMessage />
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
