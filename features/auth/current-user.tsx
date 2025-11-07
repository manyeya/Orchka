
'use client'
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function CurrentUser() {
    const session = authClient.useSession()

    return (
        <div className="font-sans flex flex-col gap-4">
            <ul>
                {session.data?.user ? (
                    <div key={session.data.user.id}>
                        <li>{session.data.user.name}</li>
                        <li>{session.data.user.email}</li>
                    </div>
                ) : <li>No users found</li>}
            </ul>
            {session.data?.user && (
                <Button onClick={() => authClient.signOut()}>Sign out</Button>
            )}
        </div>
    );
}
