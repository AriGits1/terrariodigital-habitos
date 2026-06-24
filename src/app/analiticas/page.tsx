import Link from "next/link";
import { requireProfile } from "@/features/auth/guards";
import { getAnalyticsData } from "@/features/analytics/queries";
import {
  completionRate,
  currentStreak,
  perHabitStats,
  weeklyScores,
} from "@/features/analytics/analytics";

const MOOD_EMOJIS: Record<string, string> = {
  motivated: "🤩",
  calm: "😌",
  neutral: "😐",
  anxious: "😰",
  sad: "😢",
};

export default async function AnaliticasPage() {
  const profile = await requireProfile();

  const { habits, logs, moods } = await getAnalyticsData(profile.id);
  const week = weeklyScores(habits, logs);
  const streak = currentStreak(habits, logs);
  const rate7 = completionRate(habits, logs, 7);
  const perHabit = perHabitStats(habits, logs, 7);

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 to-emerald-950 p-6 text-white">
      <header className="mx-auto mb-6 flex max-w-3xl items-center justify-between">
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← Volver al terrario
        </Link>
        <span className="text-sm text-white/60">{profile.name}</span>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <h1 className="text-2xl font-semibold">Analíticas semanales</h1>

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Racha actual" value={`${streak} d`} />
          <Stat label="Cumplimiento 7d" value={`${rate7}%`} />
          <Stat
            label="Bioma"
            value={`${profile.biome?.growth ?? 0}% `}
          />
        </div>

        {/* Weekly completion bar chart */}
        <section className="rounded-2xl bg-white/5 p-5">
          <h2 className="mb-4 text-sm font-semibold text-white/70">
            Cumplimiento diario (últimos 7 días)
          </h2>
          <div className="flex h-40 gap-4">
            {/* Eje Y */}
            <div className="flex flex-col justify-between items-center pb-6 text-xs text-white/50 w-6">
              <span>{Math.max(habits.length, Math.max(...week.map(w => w.completedCount)), 1)}</span>
              <span className="-rotate-90 text-[10px] uppercase tracking-widest text-white/40">Hábitos</span>
              <span>0</span>
            </div>
            
            {/* Barras */}
            <div className="flex flex-1 items-end justify-between gap-2">
              {week.map((d, i) => {
                const chartMax = Math.max(habits.length, Math.max(...week.map(w => w.completedCount)), 1);
                const heightPercentage = Math.max(4, (d.completedCount / chartMax) * 100);

                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
                    <div className="flex h-full w-full items-end">
                      <div
                        className="w-full rounded-t bg-emerald-400 transition-all"
                        style={{ height: `${heightPercentage}%` }}
                        title={`${d.completedCount} completado(s)`}
                      />
                    </div>
                    <span className="text-xs capitalize text-white/50">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Per-habit progress */}
        <section className="rounded-2xl bg-white/5 p-5">
          <h2 className="mb-4 text-sm font-semibold text-white/70">
            Por hábito (últimos 7 días)
          </h2>
          <ul className="flex flex-col gap-3">
            {perHabit.map((h) => (
              <li key={h.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{h.title}</span>
                  <span className="text-white/50">
                    {h.done}/{h.total} días cumplidos
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${(h.done / h.total) * 100}%` }}
                  />
                </div>
              </li>
            ))}
            {perHabit.length === 0 && (
              <li className="text-sm text-white/40">Sin hábitos todavía.</li>
            )}
          </ul>
        </section>

        {/* Mood trend */}
        <section className="rounded-2xl bg-white/5 p-5">
          <h2 className="mb-4 text-sm font-semibold text-white/70">
            Estado de ánimo reciente
          </h2>
          {moods.length > 0 ? (
            <div className="flex items-end justify-between gap-2">
              {moods.map((m, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-2xl">
                    {MOOD_EMOJIS[m.mood ?? "neutral"] ?? "😐"}
                  </span>
                  <span className="text-xs capitalize text-white/40">
                    {new Date(m.date).toLocaleDateString("es-PE", {
                      weekday: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40">
              Registra tu ánimo en el diario para ver la tendencia.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
