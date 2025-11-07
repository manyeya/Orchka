import { CurrentUser } from "@/features/auth/current-user";
import { requireAuth } from "@/lib/auth/utils";
import { caller } from "@/trpc/server";

export default async function Home() {
  await requireAuth()
  const users = await caller.getUsers()
  return (
    <div className="font-sans ">
      <CurrentUser />
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
