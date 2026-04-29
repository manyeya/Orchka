import ky from "ky"
import {
    CredentialType,
    isBlueskyCredential,
    isDiscordCredential,
    isFacebookPageCredential,
    isMastodonCredential,
    isSocialAccessTokenCredential,
    type DecryptedCredential,
} from "@orchka/credentials-core"
import { NonRetriableError } from "@orchka/nodes/core"

export async function parseJsonResponse<T>(response: Response): Promise<T> {
    try {
        return await response.json() as T
    } catch {
        return {} as T
    }
}

export function formatApiError(platform: string, status: number, payload: Record<string, unknown>): string {
    const error = payload.error
    const message = typeof payload.message === "string"
        ? payload.message
        : typeof payload.error_description === "string"
            ? payload.error_description
            : typeof error === "string"
                ? error
                : isObject(error) && typeof error.message === "string"
                    ? error.message
                    : undefined

    return `${platform} API request failed with status ${status}${message ? `: ${message}` : ""}`
}

export async function resolveAccessToken(
    platform: string,
    expectedType: CredentialType,
    data: { authType?: string; accessToken?: string; credentialId?: string },
    resolveCredential?: (credentialId: string) => Promise<DecryptedCredential>,
): Promise<string> {
    if (data.authType === "token") {
        if (!data.accessToken) {
            throw new NonRetriableError(`${platform} access token is required`)
        }
        return data.accessToken
    }

    if (!data.credentialId || !resolveCredential) {
        throw new NonRetriableError(`${platform} credential is required`)
    }

    const credential = await resolveCredential(data.credentialId)
    if (credential.type !== expectedType || !isSocialAccessTokenCredential(credential.data)) {
        throw new NonRetriableError(`${platform} requires a ${expectedType} credential`)
    }

    return credential.data.accessToken
}

export async function resolveFacebookPageToken(
    data: { authType?: string; accessToken?: string; credentialId?: string },
    resolveCredential?: (credentialId: string) => Promise<DecryptedCredential>,
): Promise<string> {
    if (data.authType === "token") {
        if (!data.accessToken) {
            throw new NonRetriableError("Facebook Page access token is required")
        }
        return data.accessToken
    }

    if (!data.credentialId || !resolveCredential) {
        throw new NonRetriableError("Facebook Page credential is required")
    }

    const credential = await resolveCredential(data.credentialId)
    if (credential.type !== CredentialType.FACEBOOK_PAGE || !isFacebookPageCredential(credential.data)) {
        throw new NonRetriableError("Facebook Page Post requires a Facebook Page credential")
    }

    return credential.data.pageAccessToken
}

export async function resolveMastodonCredential(
    credentialId: string | undefined,
    resolveCredential?: (credentialId: string) => Promise<DecryptedCredential>,
): Promise<{ instanceUrl: string; accessToken: string }> {
    if (!credentialId || !resolveCredential) {
        throw new NonRetriableError("Mastodon credential is required")
    }

    const credential = await resolveCredential(credentialId)
    if (credential.type !== CredentialType.MASTODON || !isMastodonCredential(credential.data)) {
        throw new NonRetriableError("Mastodon Post requires a Mastodon credential")
    }

    return credential.data
}

export async function resolveDiscordWebhook(
    data: { webhookUrl?: string; credentialId?: string },
    resolveCredential?: (credentialId: string) => Promise<DecryptedCredential>,
): Promise<string> {
    if (data.webhookUrl) {
        return data.webhookUrl
    }

    if (!data.credentialId || !resolveCredential) {
        throw new NonRetriableError("Discord webhook credential is required")
    }

    const credential = await resolveCredential(data.credentialId)
    if (credential.type !== CredentialType.DISCORD || !isDiscordCredential(credential.data)) {
        throw new NonRetriableError("Discord Message requires a Discord credential")
    }

    return credential.data.webhookUrl
}

export async function createBlueskySession(
    data: { credentialId?: string; identifier?: string; password?: string; serviceUrl?: string },
    resolveCredential?: (credentialId: string) => Promise<DecryptedCredential>,
): Promise<{ serviceUrl: string; accessJwt: string; did: string }> {
    let identifier = data.identifier
    let password = data.password
    let serviceUrl = data.serviceUrl || "https://bsky.social"

    if (data.credentialId && resolveCredential) {
        const credential = await resolveCredential(data.credentialId)
        if (credential.type !== CredentialType.BLUESKY || !isBlueskyCredential(credential.data)) {
            throw new NonRetriableError("Bluesky Post requires a Bluesky credential")
        }
        identifier = credential.data.identifier
        password = credential.data.password
        serviceUrl = credential.data.serviceUrl || serviceUrl
    }

    if (!identifier || !password) {
        throw new NonRetriableError("Bluesky identifier and app password are required")
    }

    const response = await ky.post(`${serviceUrl.replace(/\/$/, "")}/xrpc/com.atproto.server.createSession`, {
        json: { identifier, password },
        throwHttpErrors: false,
    })
    const payload = await parseJsonResponse<{ accessJwt?: string; did?: string } & Record<string, unknown>>(response)
    if (!response.ok || !payload.accessJwt || !payload.did) {
        throw new NonRetriableError(formatApiError("Bluesky", response.status, payload))
    }

    return { serviceUrl, accessJwt: payload.accessJwt, did: payload.did }
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null
}
