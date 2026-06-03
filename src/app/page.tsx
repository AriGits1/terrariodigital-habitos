import Link from "next/link";
import BiomeScene from "@/features/biome/BiomeScene";
import type { BiomeType } from "@/features/biome/biome-logic";
import { getActiveProfile } from "@/features/profile/queries";
import HabitsPanel from "@/features/habits/HabitsPanel";
import { getHabitsWithTodayStatus } from "@/features/habits/queries";

const BIOME_LABELS: Record<BiomeType, string> = {
  forest: "Bosque",
  desert: "Desierto",
  zen: "Jardín Zen",
};

export default async function Home() {
  const profile = await getActiveProfile();
  const biome = profile?.biome;

  const type = (biome?.type ?? "forest") as BiomeType;
  const growth = biome?.growth ?? 20;
  const health = biome?.health ?? 80;

  const habits = profile
    ? await getHabitsWithTodayStatus(profile.id)
    : [];

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* The living ecosystem fills the screen. */}
      <div className="absolute inset-0">
        <BiomeScene type={type} growth={growth} health={health} />
      </div>

      {/* HUD overlay */}
      <header className="pointer-events-none absolute left-0 top-0 p-6">
        <h1 className="text-2xl font-semibold text-white drop-shadow-md">
          🌿 Terrario Digital
        </h1>
        <p className="text-sm text-white/80 drop-shadow">
          {profile ? `Hola, ${profile.name}` : "Sin perfil — ejecutá el seed"}
        </p>
        <nav className="pointer-events-auto mt-3 flex gap-2">
          <Link
            href="/diario"
            className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/25"
          >
            🎙️ Diario matutino
          </Link>
          <Link
            href="/coach"
            className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/25"
          >
            💬 Coach
          </Link>
          <Link
            href="/analiticas"
            className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/25"
          >
            📊 Analíticas
          </Link>
          <Link
            href="/mindfulness"
            className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/25"
          >
            🧘 Mindfulness
          </Link>
          <Link
            href="/reframe"
            className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/25"
          >
            🔄 Reframe
          </Link>
          <Link
            href="/configuracion"
            className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/25"
          >
            ⚙️ Configuración
          </Link>
        </nav>
      </header>

      <section className="pointer-events-none absolute bottom-0 left-0 flex gap-4 p-6">
        <StatCard label="Bioma" value={BIOME_LABELS[type]} />
        <StatCard label="Crecimiento" value={`${growth}%`} />
        <StatCard label="Salud" value={`${health}%`} />
      </section>

      {/* Habits panel — the gamification loop lives here. */}
      {profile && (
        <div className="absolute right-0 top-0 h-full p-6">
          <HabitsPanel profileId={profile.id} habits={habits} />
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/30 px-4 py-3 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-wide text-white/70">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
