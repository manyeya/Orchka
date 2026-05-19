import { polarClient } from "@polar-sh/better-auth";
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    plugins: [polarClient(), organizationClient()],
});

export const {
    useSession,
    useListOrganizations,
    useActiveOrganization,
} = authClient

