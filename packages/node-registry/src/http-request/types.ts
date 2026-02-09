import * as z from "zod";

export const httpMethodSchema = z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]);

export const headerSchema = z.object({
    key: z.string().min(1, "Header key is required"),
    value: z.string().min(1, "Header value is required"),
    enabled: z.boolean(),
});

export const queryParamSchema = z.object({
    key: z.string().min(1, "Parameter key is required"),
    value: z.string(),
    enabled: z.boolean(),
});

export const httpSettingsSchema = z.object({
    name: z.string().min(1, "Name is required"),
    url: z.string().url("Please enter a valid URL").min(1, "URL is required"),
    method: httpMethodSchema,
    headers: z.array(headerSchema).catch([]),
    queryParams: z.array(queryParamSchema).catch([]),
    body: z.string().optional(),
    bodyType: z.enum(["none", "json", "text", "form-data", "x-www-form-urlencoded"]).catch("none"),
    authType: z.enum(["none", "bearer", "basic", "api-key", "credential"]).catch("none"),
    authToken: z.string().optional(),
    authUsername: z.string().optional(),
    authPassword: z.string().optional(),
    apiKeyHeader: z.string().optional(),
    apiKeyValue: z.string().optional(),
    credentialId: z.string().optional(),
    credentialType: z.string().optional(),
    timeout: z.number().min(0).max(300000).catch(30000),
    followRedirects: z.boolean().catch(true),
    validateSSL: z.boolean().catch(true),
    retryOnFailure: z.boolean().catch(false),
    maxRetries: z.number().min(0).max(10).catch(3),
});

export type HttpSettingsFormValues = z.infer<typeof httpSettingsSchema>;
export type HttpMethod = z.infer<typeof httpMethodSchema>;
export type Header = z.infer<typeof headerSchema>;
export type QueryParam = z.infer<typeof queryParamSchema>;
