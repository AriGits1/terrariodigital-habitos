import Link from "next/link";
import VoiceDiary from "@/features/voice/VoiceDiary";
import { getActiveProfile } from "@/features/profile/queries";
import { getRecentMoods } from "@/features/mood/queries";
import ReframeCard from "@/features/reframe/ReframeCard";

import { Smile, Heart, Meh, AlertCircle, Frown } from "lucide-react";

const MOOD_ICONS: Record<string, React.ElementType> = {
  motivated: Smile,
  calm: Heart,
  neutral: Meh,
  anxious: AlertCircle,
  sad: Frown,
};

const MOOD_ES: Record<string, string> = {
  motivated: "Motivado",
  calm: "Tranquilo",
  neutral: "Neutral",
  anxious: "Ansioso",
  sad: "Triste",
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const hasSubmittedToday = moods.some((m) => {
    const d = new Date(m.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-950 to-zinc-900 p-6 text-white">
      <header className="mx-auto mb-6 flex max-w-5xl items-center justify-between">
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← Volver al terrario
        </Link>
        <span className="text-sm text-white/60">{profile.name}</span>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 w-full max-w-2xl">
        <VoiceDiary profileId={profile.id} hasSubmittedToday={hasSubmittedToday} />

        {moods.length > 0 && (
          <section className="mt-6 rounded-2xl bg-white/5 p-5">
            <h3 className="mb-3 text-sm font-semibold text-white/70">
              Tu semana emocional
            </h3>
            <ul className="flex flex-col gap-2">
              {moods.map((m) => {
                const moodEs = m.mood ? MOOD_ES[m.mood] || m.mood : "Neutral";
                return (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 text-sm text-white/80"
                  >
                    <span className="text-emerald-400">
                      {(() => {
                        const Icon = MOOD_ICONS[m.mood ?? "neutral"] ?? Meh;
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </span>
                    <span className="w-24 text-white/50">
                      {new Date(m.date).toLocaleDateString("es-PE", {
                        weekday: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="flex-1 truncate">
                      {m.rawText ?? moodEs}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        </div>

        <div className="w-full md:w-80 shrink-0">
          <ReframeCard />
        </div>
      </div>
    </main>
  );
}
