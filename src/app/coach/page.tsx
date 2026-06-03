import Link from "next/link";
import { getActiveProfile } from "@/features/profile/queries";
import { getAgents, type ChatTurn } from "@/features/agents";
import { getCoachContext, getChatHistory } from "@/features/coach/queries";
import CoachChat from "@/features/coach/CoachChat";

export default async function CoachPage() {
  const profile = await getActiveProfile();
  if (!profile) {
    return (
      <main className="flex h-screen items-center justify-center bg-zinc-900 text-white">
        <p>No hay perfil. Ejecutá el seed primero.</p>
      </main>
    );
  }

  const context = await getCoachContext(profile.id);
  // Proactive, context-aware suggestion (Ayuda contextual).
  const suggestion = await getAgents().coach(context);
  const history = await getChatHistory(profile.id, "coach");
  const initialHistory: ChatTurn[] = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 to-emerald-950 p-6 text-white">
      <header className="mx-auto mb-6 flex max-w-2xl items-center justify-between">
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← Volver al terrario
        </Link>
        <span className="text-sm text-white/60">{profile.name}</span>
      </header>

      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold">Coach de Productividad</h1>
          <p className="text-sm text-white/60">
            {context.doneToday.length} completados · {context.pendingToday.length} pendientes hoy
          </p>
        </div>

        {/* Contextual suggestion — adapts to the user's real habit state. */}
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5">
          <p className="text-xs uppercase tracking-wide text-emerald-300">
            Sugerencia para vos, ahora
          </p>
          <p className="mt-2 text-base">{suggestion.message}</p>
        </div>

        <CoachChat
          profileId={profile.id}
          agent="coach"
          initialHistory={initialHistory}
        />
      </div>
    </main>
  );
}
