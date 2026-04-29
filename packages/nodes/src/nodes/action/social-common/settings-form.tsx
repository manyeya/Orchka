"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CredentialType } from "@orchka/credentials-core/types"
import { Button } from "@orchka/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@orchka/ui/form"
import { Input } from "@orchka/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@orchka/ui/select"
import { Separator } from "@orchka/ui/separator"
import { Textarea } from "@orchka/ui/textarea"
import { CredentialSelector } from "@orchka/nodes/editor"
import { Key } from "lucide-react"
import { useForm } from "react-hook-form"
import type { z, ZodTypeAny } from "zod"

export type FieldConfig =
    | { name: string; label: string; placeholder?: string; type?: "text" | "password" | "url" }
    | { name: string; label: string; placeholder?: string; type: "textarea" }
    | { name: string; label: string; type: "select"; options: Array<{ value: string; label: string }> }

interface SocialSettingsFormProps {
    schema: ZodTypeAny
    credentialType?: CredentialType
    defaultValues?: Record<string, unknown>
    fields: FieldConfig[]
    title: string
    description: string
    submitLabel?: string
    onSubmit: (values: Record<string, unknown>) => void
    onCancel?: () => void
}

export function SocialSettingsForm({
    schema,
    credentialType,
    defaultValues,
    fields,
    title,
    description,
    submitLabel = "Save Settings",
    onSubmit,
    onCancel,
}: SocialSettingsFormProps) {
    const form = useForm<Record<string, unknown>>({
        resolver: zodResolver(schema as any) as any,
        defaultValues,
    })

    const authType = form.watch("authType")

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-6 pr-4">
                    <div>
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field) => (
                            <ConfiguredField key={field.name} field={field} form={form} />
                        ))}
                    </div>

                    {credentialType && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <ConfiguredField
                                    form={form}
                                    field={{
                                        name: "authType",
                                        label: "Authentication",
                                        type: "select",
                                        options: [
                                            { value: "credential", label: "Stored Credential" },
                                            { value: "token", label: "Direct Token" },
                                        ],
                                    }}
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
                                                        type={credentialType}
                                                        value={field.value as string | undefined}
                                                        onChange={(config) => field.onChange(config?.credentialId)}
                                                        placeholder="Select a stored credential..."
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {authType === "token" && (
                                    <ConfiguredField
                                        form={form}
                                        field={{
                                            name: "accessToken",
                                            label: "Access Token",
                                            type: "password",
                                            placeholder: "Paste access token...",
                                        }}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>

                <Separator />
                <div className="flex justify-end gap-3 pr-4">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit">{submitLabel}</Button>
                </div>
            </form>
        </Form>
    )
}

function ConfiguredField({
    field,
    form,
}: {
    field: FieldConfig
    form: ReturnType<typeof useForm<any, unknown, any>>
}) {
    return (
        <FormField
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
                <FormItem>
                    <FormLabel>{field.label}</FormLabel>
                    <FormControl>
                        {field.type === "textarea" ? (
                            <Textarea
                                className="min-h-[140px]"
                                placeholder={field.placeholder}
                                {...formField}
                                value={formField.value ?? ""}
                            />
                        ) : field.type === "select" ? (
                                    <Select onValueChange={formField.onChange} defaultValue={String(formField.value || "")}>
                                        <SelectTrigger>
                                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {field.options.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                type={field.type || "text"}
                                placeholder={field.placeholder}
                                {...formField}
                                value={formField.value ?? ""}
                            />
                        )}
                    </FormControl>
                    <FormDescription />
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}
