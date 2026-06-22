import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/features/auth/queries";
import LoginForm from "@/features/auth/LoginForm";

export default async function LoginPage() {
  const profile = await getCurrentProfile();
  if (profile) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-950 to-zinc-900 p-6 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">Terrario Digital</h1>
          <p className="mt-1 text-sm text-white/60">Sign in to continue</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
