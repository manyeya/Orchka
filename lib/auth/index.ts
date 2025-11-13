import { betterAuth } from "better-auth";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";

import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/db";
import { polarClient } from "../polar";
import { createClient } from "redis";

const redis = createClient();
await redis.connect();

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    secondaryStorage: {
        get: async (key) => {
            return await redis.get(key);
        },
        set: async (key, value, ttl) => {
            // TTL in seconds — convert ms with ttl * 1000.
            if (ttl) await redis.set(key, value, { EX: ttl });
            // or for ioredis:
            // if (ttl) await redis.set(key, value, 'EX', ttl)
            else await redis.set(key, value);
        },
        delete: async (key) => {
            await redis.del(key);
        }
    },
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
    plugins: [
        polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
                checkout({
                    products: [
                        {
                            productId: "8c72dee4-7d5d-41e8-982a-8cd8a1412c6b",
                            slug: "Orchka-Pro" // Custom slug for easy reference in Checkout URL, e.g. /checkout/Orchka-Pro
                        }
                    ],
                    successUrl: process.env.POLAR_SUCCESS_URL,
                    authenticatedUsersOnly: true
                })
            ],
        })
    ]
});
