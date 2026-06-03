import Link from "next/link";
import VoiceDiary from "@/features/voice/VoiceDiary";
import { getActiveProfile } from "@/features/profile/queries";
import { getRecentMoods } from "@/features/mood/queries";

const MOOD_EMOJI: Record<string, string> = {
  motivated: "😄",
  calm: "🙂",
  neutral: "😐",
  anxious: "😟",
  sad: "😢",
};

export default async function DiarioPage() {
  const profile = await getActiveProfile();
  if (!profile) {
    return (
      <main className="flex h-screen items-center justify-center bg-zinc-900 text-white">
        <p>No hay perfil. Ejecutá el seed primero.</p>
      </main>
    );
  }

  const moods = await getRecentMoods(profile.id, 7);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-950 to-zinc-900 p-6 text-white">
      <header className="mx-auto mb-6 flex max-w-2xl items-center justify-between">
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← Volver al terrario
        </Link>
        <span className="text-sm text-white/60">{profile.name}</span>
      </header>

      <div className="mx-auto max-w-2xl">
        <VoiceDiary profileId={profile.id} />

        {moods.length > 0 && (
          <section className="mt-6 rounded-2xl bg-white/5 p-5">
            <h3 className="mb-3 text-sm font-semibold text-white/70">
              Tu semana emocional
            </h3>
            <ul className="flex flex-col gap-2">
              {moods.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 text-sm text-white/80"
                >
                  <span className="text-xl">
                    {MOOD_EMOJI[m.mood ?? "neutral"] ?? "😐"}
                  </span>
                  <span className="w-24 text-white/50">
                    {new Date(m.date).toLocaleDateString("es-PE", {
                      weekday: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex-1 truncate">
                    {m.rawText ?? m.mood}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
