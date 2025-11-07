
import { caller } from "@/trpc/server";

export default async function Home() {
  const users = await caller.getUsers();
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <h1>Users</h1>
      <ul>
        {users.length > 0 ? users.map((user) => (
          <div key={user.id}>
            <li>{user.name}</li>
            <li>{user.email}</li>
          </div>
        )) : <li>No users found</li>}
      </ul>
    </div>
  );
}
