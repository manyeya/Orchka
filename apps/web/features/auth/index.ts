import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { polar, checkout, portal } from "@polar-sh/better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@orchka/db";
import { polarClient } from "../../lib/polar";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
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
        organization({
            // Single-level orgs (no sub-teams) for now. Every workflow,
            // credential, and execution is scoped to organizationId.
            allowUserToCreateOrganization: true,
            organizationLimit: 10,
            membershipLimit: 50,
            creatorRole: "owner",
        }),
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
                }),
                portal()
            ],
        }),
    ]
});
