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
    <main className="relative h-[100dvh] w-screen overflow-hidden">
      {/* The living ecosystem fills the screen. */}
      <div className="absolute inset-0">
        <BiomeScene type={type} growth={growth} health={health} />
      </div>

      {/* Gradient scrims so the overlaid UI stays legible over the biome. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/40 to-transparent md:hidden" />

      {/* Top overlay: title, nav and live stats. */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-3 p-4 md:p-6">
        <div>
          <h1 className="text-xl font-semibold text-white drop-shadow-md md:text-2xl">
            🌿 Terrario Digital
          </h1>
          <p className="text-sm text-white/80 drop-shadow">
            {profile ? `Hola, ${profile.name}` : "Sin perfil — ejecutá el seed"}
          </p>
        </div>

        <nav className="pointer-events-auto flex flex-wrap gap-2">
          {[
            { href: "/diario", label: "🎙️ Diario" },
            { href: "/coach", label: "💬 Coach" },
            { href: "/analiticas", label: "📊 Analíticas" },
            { href: "/mindfulness", label: "🧘 Mindfulness" },
            { href: "/reframe", label: "🔄 Reframe" },
            { href: "/configuracion", label: "⚙️ Ajustes" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/25 md:px-4 md:py-1.5 md:text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex gap-2 md:gap-3">
          <StatCard label="Bioma" value={BIOME_LABELS[type]} />
          <StatCard label="Crecimiento" value={`${growth}%`} />
          <StatCard label="Salud" value={`${health}%`} />
        </div>
      </header>

      {/* Habits panel: bottom sheet on mobile, side panel on desktop. */}
      {profile && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 md:inset-x-auto md:right-0 md:top-0 md:bottom-auto md:h-full md:p-6">
          <HabitsPanel profileId={profile.id} habits={habits} />
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/30 px-3 py-2 backdrop-blur-sm md:px-4 md:py-3">
      <p className="text-[10px] uppercase tracking-wide text-white/70 md:text-xs">
        {label}
      </p>
      <p className="text-base font-semibold text-white md:text-lg">{value}</p>
    </div>
  );
}
