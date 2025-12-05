"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"

const httpMethodSchema = z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])

const headerSchema = z.object({
    key: z.string().min(1, "Header key is required"),
    value: z.string().min(1, "Header value is required"),
    enabled: z.boolean(),
})

const queryParamSchema = z.object({
    key: z.string().min(1, "Parameter key is required"),
    value: z.string(),
    enabled: z.boolean(),
})

const httpSettingsSchema = z.object({
    // Basic Settings
    url: z.string().url("Please enter a valid URL").min(1, "URL is required"),
    method: httpMethodSchema,

    // Headers
    headers: z.array(headerSchema).catch([]),

    // Query Parameters
    queryParams: z.array(queryParamSchema).catch([]),

    // Body
    body: z.string().optional(),
    bodyType: z.enum(["none", "json", "text", "form-data", "x-www-form-urlencoded"]).catch("none"),

    // Authentication
    authType: z.enum(["none", "bearer", "basic", "api-key"]).catch("none"),
    authToken: z.string().optional(),
    authUsername: z.string().optional(),
    authPassword: z.string().optional(),
    apiKeyHeader: z.string().optional(),
    apiKeyValue: z.string().optional(),

    // Advanced Settings
    timeout: z.number().min(0).max(300000).catch(30000),
    followRedirects: z.boolean().catch(true),
    validateSSL: z.boolean().catch(true),
    retryOnFailure: z.boolean().catch(false),
    maxRetries: z.number().min(0).max(10).catch(3),
})

export type HttpSettingsFormValues = z.infer<typeof httpSettingsSchema>

interface HttpSettingsFormProps {
    defaultValues?: Partial<HttpSettingsFormValues>
    onSubmit: (values: HttpSettingsFormValues) => void
    onCancel?: () => void
}

export function HttpSettingsForm({ defaultValues, onSubmit, onCancel }: HttpSettingsFormProps) {
    const [headers, setHeaders] = useState<z.infer<typeof headerSchema>[]>(
        defaultValues?.headers || []
    )
    const [queryParams, setQueryParams] = useState<z.infer<typeof queryParamSchema>[]>(
        defaultValues?.queryParams || []
    )

    const form = useForm<HttpSettingsFormValues>({
        resolver: zodResolver(httpSettingsSchema),
        defaultValues: {
            url: "",
            method: "GET",
            headers: [],
            queryParams: [],
            body: "",
            bodyType: "none",
            authType: "none",
            timeout: 30000,
            followRedirects: true,
            validateSSL: true,
            retryOnFailure: false,
            maxRetries: 3,
            ...defaultValues,
        },
    })

    const handleSubmit = (values: HttpSettingsFormValues) => {
        onSubmit({
            ...values,
            headers,
            queryParams,
        })
    }

    const addHeader = () => {
        setHeaders([...headers, { key: "", value: "", enabled: true }])
    }

    const removeHeader = (index: number) => {
        setHeaders(headers.filter((_, i) => i !== index))
    }

    const updateHeader = (index: number, field: keyof z.infer<typeof headerSchema>, value: string | boolean) => {
        const newHeaders = [...headers]
        newHeaders[index] = { ...newHeaders[index], [field]: value }
        setHeaders(newHeaders)
    }

    const addQueryParam = () => {
        setQueryParams([...queryParams, { key: "", value: "", enabled: true }])
    }

    const removeQueryParam = (index: number) => {
        setQueryParams(queryParams.filter((_, i) => i !== index))
    }

    const updateQueryParam = (index: number, field: keyof z.infer<typeof queryParamSchema>, value: string | boolean) => {
        const newParams = [...queryParams]
        newParams[index] = { ...newParams[index], [field]: value }
        setQueryParams(newParams)
    }

    const watchMethod = form.watch("method")
    const watchBodyType = form.watch("bodyType")
    const watchAuthType = form.watch("authType")
    const watchRetryOnFailure = form.watch("retryOnFailure")

    const showBodyTab = ["POST", "PUT", "PATCH"].includes(watchMethod)

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="space-y-6 pr-4">
                    {/* Basic Request Settings */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold">HTTP Configurations</h3>
                            <p className="text-sm text-muted-foreground">
                                  Configure your HTTP request with headers, authentication, and more
                            </p>
                        </div>
                        <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://api.example.com/endpoint" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        The complete URL for the HTTP request
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="method"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>HTTP Method</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select HTTP method" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="GET">
                                                <Badge variant="outline" className="mr-2">GET</Badge>
                                            </SelectItem>
                                            <SelectItem value="POST">
                                                <Badge variant="outline" className="mr-2">POST</Badge>
                                            </SelectItem>
                                            <SelectItem value="PUT">
                                                <Badge variant="outline" className="mr-2">PUT</Badge>
                                            </SelectItem>
                                            <SelectItem value="DELETE">
                                                <Badge variant="outline" className="mr-2">DELETE</Badge>
                                            </SelectItem>
                                            <SelectItem value="PATCH">
                                                <Badge variant="outline" className="mr-2">PATCH</Badge>
                                            </SelectItem>
                                            <SelectItem value="OPTIONS">
                                                <Badge variant="outline" className="mr-2">OPTIONS</Badge>
                                            </SelectItem>
                                            <SelectItem value="HEAD">
                                                <Badge variant="outline" className="mr-2">HEAD</Badge>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        The HTTP method to use for the request
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Separator />

                    {/* Tabs for Headers, Query Params, Body, Auth, Advanced */}
                    <Tabs defaultValue="headers" className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="headers">Headers</TabsTrigger>
                            <TabsTrigger value="params">Params</TabsTrigger>
                            <TabsTrigger value="body" disabled={!showBodyTab}>Body</TabsTrigger>
                            <TabsTrigger value="auth">Auth</TabsTrigger>
                            <TabsTrigger value="advanced">Advanced</TabsTrigger>
                        </TabsList>

                        {/* Headers Tab */}
                        <TabsContent value="headers" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-semibold">Request Headers</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Add custom headers to your request
                                    </p>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addHeader}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Header
                                </Button>
                            </div>

                            {headers.length === 0 ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    No headers added yet. Click "Add Header" to get started.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {headers.map((header, index) => (
                                        <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                                            <Switch
                                                checked={header.enabled}
                                                onCheckedChange={(checked) => updateHeader(index, "enabled", checked)}
                                            />
                                            <Input
                                                placeholder="Header name"
                                                value={header.key}
                                                onChange={(e) => updateHeader(index, "key", e.target.value)}
                                                className="flex-1"
                                            />
                                            <Input
                                                placeholder="Header value"
                                                value={header.value}
                                                onChange={(e) => updateHeader(index, "value", e.target.value)}
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeHeader(index)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Query Parameters Tab */}
                        <TabsContent value="params" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-semibold">Query Parameters</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Add URL query parameters
                                    </p>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addQueryParam}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Parameter
                                </Button>
                            </div>

                            {queryParams.length === 0 ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    No query parameters added yet. Click "Add Parameter" to get started.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {queryParams.map((param, index) => (
                                        <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                                            <Switch
                                                checked={param.enabled}
                                                onCheckedChange={(checked) => updateQueryParam(index, "enabled", checked)}
                                            />
                                            <Input
                                                placeholder="Parameter name"
                                                value={param.key}
                                                onChange={(e) => updateQueryParam(index, "key", e.target.value)}
                                                className="flex-1"
                                            />
                                            <Input
                                                placeholder="Parameter value"
                                                value={param.value}
                                                onChange={(e) => updateQueryParam(index, "value", e.target.value)}
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeQueryParam(index)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Body Tab */}
                        <TabsContent value="body" className="space-y-4">
                            <FormField
                                control={form.control}
                                name="bodyType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Body Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select body type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="json">JSON</SelectItem>
                                                <SelectItem value="text">Plain Text</SelectItem>
                                                <SelectItem value="form-data">Form Data</SelectItem>
                                                <SelectItem value="x-www-form-urlencoded">URL Encoded</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {watchBodyType !== "none" && (
                                <FormField
                                    control={form.control}
                                    name="body"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Request Body</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder={
                                                        watchBodyType === "json"
                                                            ? '{\n  "key": "value"\n}'
                                                            : "Enter request body"
                                                    }
                                                    className="font-mono text-sm min-h-[200px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                {watchBodyType === "json" && "Enter valid JSON data"}
                                                {watchBodyType === "text" && "Enter plain text data"}
                                                {watchBodyType === "form-data" && "Enter form data"}
                                                {watchBodyType === "x-www-form-urlencoded" && "Enter URL encoded data"}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </TabsContent>

                        {/* Authentication Tab */}
                        <TabsContent value="auth" className="space-y-4">
                            <FormField
                                control={form.control}
                                name="authType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Authentication Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select authentication type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">No Authentication</SelectItem>
                                                <SelectItem value="bearer">Bearer Token</SelectItem>
                                                <SelectItem value="basic">Basic Auth</SelectItem>
                                                <SelectItem value="api-key">API Key</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {watchAuthType === "bearer" && (
                                <FormField
                                    control={form.control}
                                    name="authToken"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bearer Token</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Enter bearer token" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                The token will be sent in the Authorization header
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {watchAuthType === "basic" && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="authUsername"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Username</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter username" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="authPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="Enter password" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}

                            {watchAuthType === "api-key" && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="apiKeyHeader"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>API Key Header Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., X-API-Key" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    The header name for the API key
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="apiKeyValue"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>API Key Value</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="Enter API key" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}
                        </TabsContent>

                        {/* Advanced Settings Tab */}
                        <TabsContent value="advanced" className="space-y-4">
                            <FormField
                                control={form.control}
                                name="timeout"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Timeout (ms)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="30000"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Request timeout in milliseconds (max 300000)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="followRedirects"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Follow Redirects</FormLabel>
                                            <FormDescription>
                                                Automatically follow HTTP redirects
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="validateSSL"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Validate SSL Certificate</FormLabel>
                                            <FormDescription>
                                                Verify SSL certificates for HTTPS requests
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="retryOnFailure"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Retry on Failure</FormLabel>
                                            <FormDescription>
                                                Automatically retry failed requests
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {watchRetryOnFailure && (
                                <FormField
                                    control={form.control}
                                    name="maxRetries"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Maximum Retries</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="3"
                                                    min="0"
                                                    max="10"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Number of retry attempts (max 10)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Form Actions */}
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
