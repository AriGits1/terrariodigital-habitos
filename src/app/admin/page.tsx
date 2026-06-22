import Link from "next/link";
import { requireAdmin } from "@/features/auth/guards";
import { createUserAction } from "@/features/auth/actions";
import { prisma } from "@/lib/db";

export default async function AdminPage(props: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  await requireAdmin();

  const searchParams = props.searchParams ? await props.searchParams : {};
  const successMsg = searchParams.success;
  const errorMsg = searchParams.error;

  const users = await prisma.profile.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  async function handleCreateUser(formData: FormData) {
    "use server";
    const result = await createUserAction(formData);
    // redirect back with query param to show feedback
    const { redirect } = await import("next/navigation");
    if ("error" in result) {
      redirect(`/admin?error=${encodeURIComponent(result.error)}`);
    } else {
      redirect("/admin?success=1");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 to-emerald-950 p-6 text-white">
      <header className="mx-auto mb-8 flex max-w-3xl items-center justify-between">
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← Back to terrarium
        </Link>
        <h1 className="text-xl font-semibold">Admin — User Management</h1>
      </header>

      <div className="mx-auto max-w-3xl flex flex-col gap-8">
        {/* Create user form */}
        <section className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          <h2 className="mb-4 text-lg font-semibold">Create user</h2>

          {successMsg && (
            <p className="mb-4 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300">
              User created successfully.
            </p>
          )}
          {errorMsg && (
            <p className="mb-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300">
              {errorMsg}
            </p>
          )}

          <form action={handleCreateUser} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="name" className="text-sm text-white/70">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="rounded-xl bg-white/10 px-4 py-2 text-white placeholder-white/40 outline-none ring-1 ring-white/20 focus:ring-emerald-400"
                  placeholder="Alice"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-sm text-white/70">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="rounded-xl bg-white/10 px-4 py-2 text-white placeholder-white/40 outline-none ring-1 ring-white/20 focus:ring-emerald-400"
                  placeholder="alice@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="password" className="text-sm text-white/70">
                  Initial password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="rounded-xl bg-white/10 px-4 py-2 text-white placeholder-white/40 outline-none ring-1 ring-white/20 focus:ring-emerald-400"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="role" className="text-sm text-white/70">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue="user"
                  className="rounded-xl bg-white/10 px-4 py-2 text-white outline-none ring-1 ring-white/20 focus:ring-emerald-400"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 rounded-xl bg-emerald-500 py-2 font-semibold text-black transition hover:bg-emerald-400"
            >
              Create user
            </button>
          </form>
        </section>

        {/* User list */}
        <section className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          <h2 className="mb-4 text-lg font-semibold">
            Users ({users.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/50">
                  <th className="pb-2 text-left font-medium">Name</th>
                  <th className="pb-2 text-left font-medium">Email</th>
                  <th className="pb-2 text-left font-medium">Role</th>
                  <th className="pb-2 text-left font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5">
                    <td className="py-2 pr-4">{u.name}</td>
                    <td className="py-2 pr-4 text-white/70">
                      {u.email ?? "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2 text-white/50">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-white/40">
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
