"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    CredentialType,
    getCredentialTypeLabel,
    apiKeyCredentialSchema,
    basicAuthCredentialSchema,
    bearerTokenCredentialSchema,
    oauth2CredentialSchema,
    openaiCredentialSchema,
    anthropicCredentialSchema,
    googleAICredentialSchema,
} from "@/lib/credentials/types"
import { Loader2Icon, Eye, EyeOff, FlaskConical, CheckCircle2, XCircle } from "lucide-react"
import { useState } from "react"
import { useTestCredential } from "../hooks/use-credentials"

// Form schema for creating/editing credentials
const credentialFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.nativeEnum(CredentialType),
    data: z.record(z.string(), z.unknown()),
})

type CredentialFormValues = z.infer<typeof credentialFormSchema>

interface CredentialFormProps {
    defaultValues?: Partial<CredentialFormValues>
    onSubmit: (values: CredentialFormValues) => void
    isSubmitting?: boolean
    submitLabel?: string
}

export const CredentialForm = ({
    defaultValues,
    onSubmit,
    isSubmitting = false,
    submitLabel = "Save Credential",
}: CredentialFormProps) => {
    const form = useForm<CredentialFormValues>({
        resolver: zodResolver(credentialFormSchema),
        defaultValues: {
            name: defaultValues?.name ?? "",
            type: defaultValues?.type ?? CredentialType.API_KEY,
            data: defaultValues?.data ?? {},
        },
    })

    const selectedType = form.watch("type")
    const testCredential = useTestCredential()
    const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)

    const handleSubmit = (values: CredentialFormValues) => {
        onSubmit(values)
    }

    const handleTest = async () => {
        const data = form.getValues("data")
        const type = form.getValues("type")
        
        // Reset previous test result
        setTestResult(null)
        
        try {
            const result = await testCredential.mutateAsync({ type, data })
            setTestResult(result)
        } catch {
            setTestResult({ success: false, error: "Failed to test credential" })
        }
    }

    // Check if the credential type supports testing
    const supportsTest = [
        CredentialType.OPENAI,
        CredentialType.ANTHROPIC,
        CredentialType.GOOGLE_AI,
    ].includes(selectedType)

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="My API Key" {...field} />
                            </FormControl>
                            <FormDescription>
                                A unique name to identify this credential
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select
                                onValueChange={(value) => {
                                    field.onChange(value)
                                    // Reset data and test result when type changes
                                    form.setValue("data", {})
                                    setTestResult(null)
                                }}
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select credential type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.values(CredentialType).map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {getCredentialTypeLabel(type)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                The type of authentication this credential provides
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-4 pt-2">
                    <CredentialTypeFields
                        type={selectedType}
                        form={form}
                    />
                </div>

                {/* Test Result Display */}
                {testResult && (
                    <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
                        testResult.success 
                            ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" 
                            : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                    }`}>
                        {testResult.success ? (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Credential test successful!</span>
                            </>
                        ) : (
                            <>
                                <XCircle className="h-4 w-4" />
                                <span>{testResult.error || "Credential test failed"}</span>
                            </>
                        )}
                    </div>
                )}

                <div className="flex gap-2">
                    {supportsTest && (
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleTest}
                            disabled={testCredential.isPending}
                        >
                            {testCredential.isPending ? (
                                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <FlaskConical className="mr-2 h-4 w-4" />
                            )}
                            Test
                        </Button>
                    )}
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                        {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                        {submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    )
}


// Type-specific field components
interface CredentialTypeFieldsProps {
    type: CredentialType
    form: ReturnType<typeof useForm<CredentialFormValues>>
}

const CredentialTypeFields = ({ type, form }: CredentialTypeFieldsProps) => {
    switch (type) {
        case CredentialType.API_KEY:
            return <ApiKeyFields form={form} />
        case CredentialType.BASIC_AUTH:
            return <BasicAuthFields form={form} />
        case CredentialType.BEARER_TOKEN:
            return <BearerTokenFields form={form} />
        case CredentialType.OAUTH2:
            return <OAuth2Fields form={form} />
        case CredentialType.OPENAI:
            return <OpenAIFields form={form} />
        case CredentialType.ANTHROPIC:
            return <AnthropicFields form={form} />
        case CredentialType.GOOGLE_AI:
            return <GoogleAIFields form={form} />
        default:
            return null
    }
}

// Password input with show/hide toggle
interface SecretInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

const SecretInput = ({ value, onChange, placeholder }: SecretInputProps) => {
    const [showSecret, setShowSecret] = useState(false)

    return (
        <div className="relative">
            <Input
                type={showSecret ? "text" : "password"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pr-10"
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowSecret(!showSecret)}
            >
                {showSecret ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                )}
            </Button>
        </div>
    )
}

// API Key Fields (Requirements: 5.5)
const ApiKeyFields = ({ form }: { form: ReturnType<typeof useForm<CredentialFormValues>> }) => {
    return (
        <FormField
            control={form.control}
            name="data.apiKey"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                        <SecretInput
                            value={(field.value as string) ?? ""}
                            onChange={field.onChange}
                            placeholder="sk-..."
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}

// Basic Auth Fields (Requirements: 5.6)
const BasicAuthFields = ({ form }: { form: ReturnType<typeof useForm<CredentialFormValues>> }) => {
    return (
        <>
            <FormField
                control={form.control}
                name="data.username"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                            <Input
                                value={(field.value as string) ?? ""}
                                onChange={field.onChange}
                                placeholder="username"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="data.password"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <SecretInput
                                value={(field.value as string) ?? ""}
                                onChange={field.onChange}
                                placeholder="••••••••"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </>
    )
}

// Bearer Token Fields (Requirements: 5.7)
const BearerTokenFields = ({ form }: { form: ReturnType<typeof useForm<CredentialFormValues>> }) => {
    return (
        <FormField
            control={form.control}
            name="data.token"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Token</FormLabel>
                    <FormControl>
                        <SecretInput
                            value={(field.value as string) ?? ""}
                            onChange={field.onChange}
                            placeholder="Bearer token..."
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}

// OAuth2 Fields (Requirements: 5.8)
const OAuth2Fields = ({ form }: { form: ReturnType<typeof useForm<CredentialFormValues>> }) => {
    return (
        <>
            <FormField
                control={form.control}
                name="data.clientId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Client ID</FormLabel>
                        <FormControl>
                            <Input
                                value={(field.value as string) ?? ""}
                                onChange={field.onChange}
                                placeholder="Client ID"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="data.clientSecret"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Client Secret</FormLabel>
                        <FormControl>
                            <SecretInput
                                value={(field.value as string) ?? ""}
                                onChange={field.onChange}
                                placeholder="Client secret..."
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="data.accessToken"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Access Token (Optional)</FormLabel>
                        <FormControl>
                            <SecretInput
                                value={(field.value as string) ?? ""}
                                onChange={field.onChange}
                                placeholder="Access token..."
                            />
                        </FormControl>
                        <FormDescription>
                            Optional: Pre-existing access token
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="data.refreshToken"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Refresh Token (Optional)</FormLabel>
                        <FormControl>
                            <SecretInput
                                value={(field.value as string) ?? ""}
                                onChange={field.onChange}
                                placeholder="Refresh token..."
                            />
                        </FormControl>
                        <FormDescription>
                            Optional: Token used to refresh the access token
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </>
    )
}

// OpenAI Fields
const OpenAIFields = ({ form }: { form: ReturnType<typeof useForm<CredentialFormValues>> }) => {
    return (
        <>
            <FormField
                control={form.control}
                name="data.apiKey"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                            <SecretInput
                                value={(field.value as string) ?? ""}
                                onChange={field.onChange}
                                placeholder="sk-..."
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="data.organization"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Organization (Optional)</FormLabel>
                        <FormControl>
                            <Input
                                value={(field.value as string) ?? ""}
                                onChange={field.onChange}
                                placeholder="org-..."
                            />
                        </FormControl>
                        <FormDescription>
                            Optional: Your OpenAI organization ID
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </>
    )
}

// Anthropic Fields
const AnthropicFields = ({ form }: { form: ReturnType<typeof useForm<CredentialFormValues>> }) => {
    return (
        <FormField
            control={form.control}
            name="data.apiKey"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                        <SecretInput
                            value={(field.value as string) ?? ""}
                            onChange={field.onChange}
                            placeholder="sk-ant-..."
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}

// Google AI Fields
const GoogleAIFields = ({ form }: { form: ReturnType<typeof useForm<CredentialFormValues>> }) => {
    return (
        <FormField
            control={form.control}
            name="data.apiKey"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                        <SecretInput
                            value={(field.value as string) ?? ""}
                            onChange={field.onChange}
                            placeholder="AIza..."
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}
