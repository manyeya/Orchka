import { NonRetriableError } from "@/lib/errors/workflow-errors";

import { HttpSettingsFormValues } from "./http-settings-form";
import ky, { Options as KyOptions, HTTPError } from 'ky';
import { publishNodeStatus } from "../../utils/realtime";
import { NodeType } from "@/features/nodes/types";
import {
    CredentialType,
    isApiKeyCredential,
    isBasicAuthCredential,
    isBearerTokenCredential
} from "@/features/credentials/utils/types";
import type { DecryptedCredential } from "@/features/credentials/utils/execution";
import { NodeExecutor, WorkflowContext } from "../../utils/execution/types";

interface HttpResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: unknown;
    ok: boolean;
    url: string;
}

interface ResolvedAuth {
    headers: Record<string, string>;
}

/**
 * HTTPS Request Executor using ky
 */
export const httpsRequestExecutor: NodeExecutor<HttpSettingsFormValues> = async ({
    data,
    nodeId,
    context,
    publish,
    resolveCredential
}): Promise<WorkflowContext> => {
    await publishNodeStatus(publish, nodeId, "loading", NodeType.HTTP_REQUEST);

    if (!data.url) {
        await publishNodeStatus(publish, nodeId, "error", NodeType.HTTP_REQUEST);
        throw new NonRetriableError('URL is required');
    }

    const nodeName = data.name || `HTTP Request`;

    try {
        // Build the complete URL with query parameters
        const url = buildUrlWithQueryParams(data.url, data.queryParams || []);

        // Resolve credential-based authentication if configured
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
            throwHttpErrors: false,
        };

        // Add body for methods that support it
        if (['POST', 'PUT', 'PATCH'].includes(data.method)) {
            if (json !== undefined) {
                kyOptions.json = json;
            } else if (body !== undefined) {
                kyOptions.body = body;
            }
        }

        let response: HttpResponse;
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
                const buffer = await res.arrayBuffer();
                responseData = Buffer.from(buffer).toString('base64');
            }

            response = {
                status: res.status,
                statusText: res.statusText,
                headers: Object.fromEntries(res.headers.entries()),
                data: responseData,
                ok: res.ok,
                url: res.url,
            };
        } catch (error) {
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

                response = {
                    status: res.status,
                    statusText: res.statusText,
                    headers: Object.fromEntries(res.headers.entries()),
                    data: responseData,
                    ok: false,
                    url: res.url,
                };
            } else if (error instanceof Error && error.name === 'TimeoutError') {
                await publishNodeStatus(publish, nodeId, "error", NodeType.HTTP_REQUEST);
                throw new NonRetriableError(`Request timed out after ${data.timeout || 30000}ms`);
            } else {
                throw error;
            }
        }

        await publishNodeStatus(publish, nodeId, "success", NodeType.HTTP_REQUEST);

        return {
            ...context,
            [`${nodeName}`]: {
                status: response.status,
                data: response.data,
                headers: response.headers,
            },
        };
    } catch (error) {
        await publishNodeStatus(publish, nodeId, "error", NodeType.HTTP_REQUEST);
        throw error;
    }
};

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

function buildHeaders(data: HttpSettingsFormValues, credentialAuth: ResolvedAuth | null): Record<string, string> {
    const headers: Record<string, string> = {};

    if (data.headers) {
        for (const header of data.headers) {
            if (header.enabled && header.key) {
                headers[header.key] = header.value;
            }
        }
    }

    if (data.bodyType && data.bodyType !== 'none' && data.bodyType !== 'json') {
        switch (data.bodyType) {
            case 'text': headers['Content-Type'] = 'text/plain'; break;
            case 'x-www-form-urlencoded': headers['Content-Type'] = 'application/x-www-form-urlencoded'; break;
        }
    }

    if (data.authType === 'credential' && credentialAuth) {
        Object.assign(headers, credentialAuth.headers);
    } else {
        switch (data.authType) {
            case 'bearer':
                if (data.authToken) headers['Authorization'] = `Bearer ${data.authToken}`;
                break;
            case 'basic':
                if (data.authUsername && data.authPassword) {
                    const credentials = Buffer.from(`${data.authUsername}:${data.authPassword}`).toString('base64');
                    headers['Authorization'] = `Basic ${credentials}`;
                }
                break;
            case 'api-key':
                if (data.apiKeyHeader && data.apiKeyValue) headers[data.apiKeyHeader] = data.apiKeyValue;
                break;
        }
    }

    return headers;
}

function buildRequestBody(data: HttpSettingsFormValues): { body?: string | FormData; json?: unknown } {
    if (!data.body || data.bodyType === 'none') {
        return {};
    }

    switch (data.bodyType) {
        case 'json':
            try {
                return { json: JSON.parse(data.body) };
            } catch {
                return { body: data.body };
            }
        case 'text':
            return { body: data.body };
        case 'form-data': {
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
        }
        case 'x-www-form-urlencoded': {
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
        }
        default:
            return { body: data.body };
    }
}