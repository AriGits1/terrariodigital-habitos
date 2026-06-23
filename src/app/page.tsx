import Link from "next/link";
import { Mic, BarChart2, Wind, Settings, Shield, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { BiomeType } from "@/features/biome/biome-logic";
import { requireProfile } from "@/features/auth/guards";
import HabitsPanel from "@/features/habits/HabitsPanel";
import { getHabitsWithTodayStatus, getHabitSuggestions } from "@/features/habits/queries";
import CoachModal from "@/features/coach/CoachModal";
import { getAdaptiveHomeData } from "@/features/adaptation/state";
import type { ModuleKey } from "@/features/adaptation/engine";

import BiomeSceneWrapper from "@/features/biome/BiomeSceneWrapper";

const BIOME_LABELS: Record<BiomeType, string> = {
  forest: "Bosque",
  desert: "Desierto",
  zen: "Jardín Zen",
};

// Nav lookup map — keyed by ModuleKey so adaptive ordering can drive rendering.
const NAV: Record<ModuleKey, { href: string; label: string; icon: LucideIcon }> = {
  diario:      { href: "/diario",      label: "Diario",     icon: Mic },
  analiticas:  { href: "/analiticas",  label: "Analíticas", icon: BarChart2 },
  mindfulness: { href: "/mindfulness", label: "Respiración", icon: Wind },
};

export default async function Home(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const showCoach = searchParams.coach === "true";
  const habitId = typeof searchParams.habitId === "string" ? searchParams.habitId : undefined;
  const habitTitle = typeof searchParams.habitTitle === "string" ? decodeURIComponent(searchParams.habitTitle) : undefined;

  const profile = await requireProfile();
  const biome = profile.biome;

  const type = (biome?.type ?? "forest") as BiomeType;
  const growth = biome?.growth ?? 20;
  const health = biome?.health ?? 80;

  // Parallel reads: habit query and adaptive home data do not depend on each other.
  const [habits, homeData, habitSuggestions] = await Promise.all([
    getHabitsWithTodayStatus(profile.id),
    getAdaptiveHomeData(profile.id),
    getHabitSuggestions(profile.id),
  ]);

  const { moduleOrder, lowEngagement, adaptationReason } = homeData;

  // Merge suggestions into habits for HabitsPanel
  const habitsWithSuggestions = habits.map((h) => {
    const s = habitSuggestions.get(h.id);
    return s ? { ...h, suggestion: s.suggestion, suggestionReason: s.reason } : h;
  });

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden">
      {/* The living ecosystem fills the screen. */}
      <div className="absolute inset-0">
        <BiomeSceneWrapper type={type} habits={habits} />
      </div>

      {/* Gradient scrims so the overlaid UI stays legible over the biome. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/40 to-transparent md:hidden" />

      {/* Top overlay: title, nav and live stats. */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-3 p-4 md:p-6">
        <div>
          <h1 className="text-xl font-semibold text-white drop-shadow-md md:text-2xl flex items-center gap-2">
            Terrario Digital
          </h1>
          <p className="text-sm text-white/80 drop-shadow">
            {`Hola, ${profile.name}`}
          </p>
        </div>

        <nav className="pointer-events-auto flex flex-wrap gap-2">
          {moduleOrder.map((k) => {
            const item = NAV[k];
            const hasLowEngagement = lowEngagement.has(k);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/25 md:px-4 md:py-1.5 md:text-sm"
              >
                <item.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                {item.label}
                {hasLowEngagement && (
                  <span
                    className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-400"
                    title="Hace tiempo que no visitás esta sección"
                    aria-label="Sección sin visitar recientemente"
                  />
                )}
              </Link>
            );
          })}

          {/* Admin link: visible only to admins. Authorization is still
              enforced server-side by requireAdmin() — this is convenience,
              not a security boundary. */}
          <Link
            href="/comunidad"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/25 md:px-4 md:py-1.5 md:text-sm"
          >
            <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Comunidad
          </Link>

          {profile.role === "admin" && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/25 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm hover:bg-emerald-500/40 md:px-4 md:py-1.5 md:text-sm"
            >
              <Shield className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* Transparency affordance — shown only after adaptation has computed a reason */}
        {adaptationReason && (
          <details className="pointer-events-auto max-w-xs">
            <summary className="cursor-pointer text-xs text-white/60 underline decoration-dotted hover:text-white/80 list-none">
              ¿por qué veo esto?
            </summary>
            <p className="mt-1 rounded-lg bg-black/40 px-3 py-2 text-xs text-white/80 backdrop-blur-sm">
              {adaptationReason}
            </p>
          </details>
        )}

        <div className="flex gap-2 md:gap-3">
          <StatCard label="Bioma" value={BIOME_LABELS[type]} />
          <StatCard label="Crecimiento" value={`${growth}%`} />
          <StatCard label="Salud" value={`${health}%`} />
        </div>
      </header>

      {/* Habits panel: bottom sheet on mobile, side panel on desktop. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 md:inset-x-auto md:right-0 md:top-0 md:bottom-auto md:h-full md:p-6">
        <HabitsPanel habits={habitsWithSuggestions} />
      </div>

      {/* Coach Modal */}
      {showCoach && <CoachModal profileId={profile.id} habitId={habitId} habitTitle={habitTitle} />}

      {/* Settings Button */}
      <div className="pointer-events-auto absolute bottom-4 right-4 md:bottom-6 md:right-6 z-10">
        <Link
          href="/configuracion"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-black hover:bg-emerald-400 hover:scale-105 shadow-lg backdrop-blur-md transition-all"
          title="Ajustes"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>
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
