import { NonRetriableError } from "inngest";
import { NodeExecutor, WorkflowContext } from "../../utils/execution/types";
import { HttpSettingsFormValues } from "./http-settings-form";
import ky, { Options as KyOptions, HTTPError } from 'ky';
import { publishNodeStatus } from "../../utils/realtime";
import { NodeType } from "@/features/nodes/types";
import { 
    CredentialType, 
    isApiKeyCredential, 
    isBasicAuthCredential, 
    isBearerTokenCredential 
} from "@/lib/credentials/types";
import type { DecryptedCredential } from "@/lib/credentials/execution";

/**
 * Response structure from the HTTP request
 */
interface HttpResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: unknown;
    ok: boolean;
    url: string;
}

/**
 * Resolved authentication headers from credentials
 */
interface ResolvedAuth {
    headers: Record<string, string>;
}

/**
 * Advanced HTTPS Request Executor using ky
 * 
 * Handles all HTTP settings values from HttpSettingsFormValues:
 * - URL with query parameters
 * - HTTP Methods (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
 * - Custom headers with enable/disable support
 * - Body types (none, json, text, form-data, x-www-form-urlencoded)
 * - Authentication (none, bearer, basic, api-key, credential)
 * - Advanced settings (timeout, followRedirects, validateSSL, retryOnFailure, maxRetries)
 * 
 * Requirements: 3.3 - Retrieve and decrypt credential data during workflow execution
 */
export const httpsRequestExecutor: NodeExecutor<HttpSettingsFormValues> = async ({
    data,
    nodeId,
    context,
    step,
    publish,
    resolveCredential
}): Promise<WorkflowContext> => {
    await publishNodeStatus(publish, nodeId, "loading", NodeType.HTTP_REQUEST, undefined, step)

    // Validate required URL
    if (!data.url) {
        await publishNodeStatus(publish, nodeId, "error", NodeType.HTTP_REQUEST, undefined, step);
        throw new NonRetriableError('URL is required');
    }

    // Use the node name for step naming (fallback to nodeId if no name)
    const nodeName = data.name || `HTTP Request`;
    const stepName = `${nodeName} (${nodeId})`;

    // Execute the HTTP request within a step
    const response = await step.run(stepName, async (): Promise<HttpResponse> => {
        // Build the complete URL with query parameters
        const url = buildUrlWithQueryParams(data.url, data.queryParams || []);

        // Resolve credential-based authentication if configured
        // Requirements: 3.3
        let credentialAuth: ResolvedAuth | null = null;
        if (data.authType === 'credential' && data.credentialId && resolveCredential) {
            const credential = await resolveCredential(data.credentialId);
            credentialAuth = resolveCredentialAuth(credential);
        }

        // Build headers including auth headers and content-type
        const headers = buildHeaders(data, credentialAuth);

        // Build request body based on body type
        const { body, json } = buildRequestBody(data);

        // Build ky options
        const kyOptions: KyOptions = {
            method: data.method || 'GET',
            headers,
            timeout: data.timeout || 30000,
            redirect: data.followRedirects === false ? 'manual' : 'follow',
            retry: data.retryOnFailure ? {
                limit: data.maxRetries || 3,
                methods: ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'],
                statusCodes: [408, 413, 429, 500, 502, 503, 504],
                backoffLimit: 10000,
            } : 0,
            throwHttpErrors: false, // We'll handle errors ourselves
        };

        // Add body for methods that support it
        if (['POST', 'PUT', 'PATCH'].includes(data.method)) {
            if (json !== undefined) {
                kyOptions.json = json;
            } else if (body !== undefined) {
                kyOptions.body = body;
            }
        }

        try {
            const res = await ky(url, kyOptions);

            // Parse response based on content type
            const contentType = res.headers.get('content-type') || '';
            let responseData: unknown;

            if (contentType.includes('application/json')) {
                responseData = await res.json();
            } else if (contentType.includes('text/')) {
                responseData = await res.text();
            } else {
                // For binary data, return base64 encoded string
                const buffer = await res.arrayBuffer();
                responseData = Buffer.from(buffer).toString('base64');
            }

            return {
                status: res.status,
                statusText: res.statusText,
                headers: Object.fromEntries(res.headers.entries()),
                data: responseData,
                ok: res.ok,
                url: res.url,
            };
        } catch (error) {
            await publishNodeStatus(publish, nodeId, "error", NodeType.HTTP_REQUEST, undefined, step);
            // Handle ky-specific errors
            if (error instanceof HTTPError) {
                const res = error.response;
                let responseData: unknown;

                try {
                    const contentType = res.headers.get('content-type') || '';
                    if (contentType.includes('application/json')) {
                        responseData = await res.json();
                    } else {
                        responseData = await res.text();
                    }
                } catch {
                    responseData = null;
                }

                return {
                    status: res.status,
                    statusText: res.statusText,
                    headers: Object.fromEntries(res.headers.entries()),
                    data: responseData,
                    ok: false,
                    url: res.url,
                };
            }

            // Handle timeout errors
            if (error instanceof Error && error.name === 'TimeoutError') {
                await publishNodeStatus(publish, nodeId, "error", NodeType.HTTP_REQUEST, undefined, step);

                throw new NonRetriableError(`Request timed out after ${data.timeout || 30000}ms`);
            }

            // Re-throw other errors
            throw error;
        }
    });

    await publishNodeStatus(publish, nodeId, "success", NodeType.HTTP_REQUEST, undefined, step);
    // Return WorkflowContext with response data
    // Include both nodeId and nodeName for flexible access
    return {
        ...context,
        [`${nodeName}`]: {
            [`status`]: response.status,
            [`data`]: response.data,
            [`headers`]: response.headers,
        },
    };
};

/**
 * Resolve authentication headers from a decrypted credential
 * Requirements: 3.3
 */
function resolveCredentialAuth(credential: DecryptedCredential): ResolvedAuth {
    const { type, data } = credential;
    const headers: Record<string, string> = {};

    switch (type) {
        case CredentialType.BEARER_TOKEN:
            if (isBearerTokenCredential(data)) {
                headers['Authorization'] = `Bearer ${data.token}`;
            }
            break;
            
        case CredentialType.BASIC_AUTH:
            if (isBasicAuthCredential(data)) {
                const credentials = Buffer.from(`${data.username}:${data.password}`).toString('base64');
                headers['Authorization'] = `Basic ${credentials}`;
            }
            break;
            
        case CredentialType.API_KEY:
            if (isApiKeyCredential(data)) {
                // Default to X-API-Key header for API key credentials
                headers['X-API-Key'] = data.apiKey;
            }
            break;
            
        default:
            throw new NonRetriableError(
                `Unsupported credential type for HTTP request: ${type}. ` +
                `Supported types: ${CredentialType.BEARER_TOKEN}, ${CredentialType.BASIC_AUTH}, ${CredentialType.API_KEY}`
            );
    }

    return { headers };
}

/**
 * Build URL with query parameters
 */
function buildUrlWithQueryParams(
    baseUrl: string,
    queryParams: Array<{ key: string; value: string; enabled: boolean }>
): string {
    const url = new URL(baseUrl);

    for (const param of queryParams) {
        if (param.enabled && param.key) {
            url.searchParams.append(param.key, param.value);
        }
    }

    return url.toString();
}

/**
 * Build headers including authentication and content-type
 * Requirements: 3.3 - Support credential-based authentication
 */
function buildHeaders(data: HttpSettingsFormValues, credentialAuth: ResolvedAuth | null): Record<string, string> {
    const headers: Record<string, string> = {};

    // Add custom headers (only enabled ones)
    if (data.headers) {
        for (const header of data.headers) {
            if (header.enabled && header.key) {
                headers[header.key] = header.value;
            }
        }
    }

    // Add Content-Type header based on body type (except for json which ky handles)
    if (data.bodyType && data.bodyType !== 'none' && data.bodyType !== 'json') {
        switch (data.bodyType) {
            case 'text':
                headers['Content-Type'] = 'text/plain';
                break;
            case 'form-data':
                // Don't set Content-Type for form-data, let the browser set it with boundary
                break;
            case 'x-www-form-urlencoded':
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
                break;
        }
    }

    // Add authentication headers
    // If using credential-based auth, use the resolved credential headers
    if (data.authType === 'credential' && credentialAuth) {
        Object.assign(headers, credentialAuth.headers);
    } else {
        // Use inline authentication values
        switch (data.authType) {
            case 'bearer':
                if (data.authToken) {
                    headers['Authorization'] = `Bearer ${data.authToken}`;
                }
                break;
            case 'basic':
                if (data.authUsername && data.authPassword) {
                    const credentials = Buffer.from(`${data.authUsername}:${data.authPassword}`).toString('base64');
                    headers['Authorization'] = `Basic ${credentials}`;
                }
                break;
            case 'api-key':
                if (data.apiKeyHeader && data.apiKeyValue) {
                    headers[data.apiKeyHeader] = data.apiKeyValue;
                }
                break;
        }
    }

    return headers;
}

/**
 * Build request body based on body type
 * Returns either body (for text/form) or json (for JSON data)
 */
function buildRequestBody(data: HttpSettingsFormValues): { body?: string | FormData; json?: unknown } {
    if (!data.body || data.bodyType === 'none') {
        return {};
    }

    switch (data.bodyType) {
        case 'json':
            // Parse JSON and use ky's json option for proper handling
            try {
                const parsed = JSON.parse(data.body);
                return { json: parsed };
            } catch {

                // If parsing fails, return as text body
                return { body: data.body };
            }
        case 'text':
            return { body: data.body };
        case 'form-data':
            // Parse body as key=value pairs and create FormData
            const formData = new FormData();
            const lines = data.body.split('\n');
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    formData.append(key.trim(), valueParts.join('=').trim());
                }
            }
            return { body: formData as unknown as string };
        case 'x-www-form-urlencoded':
            // Parse body as key=value pairs and encode
            const params = new URLSearchParams();
            const urlLines = data.body.split('\n');
            for (const line of urlLines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    params.append(key.trim(), valueParts.join('=').trim());
                }
            }
            return { body: params.toString() };
        default:
            return { body: data.body };
    }
}