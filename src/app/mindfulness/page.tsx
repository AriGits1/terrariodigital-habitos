import Link from "next/link";
import { requireProfile } from "@/features/auth/guards";
import MindfulnessGuide from "@/features/mindfulness/MindfulnessGuide";

export default async function MindfulnessPage() {
  const profile = await requireProfile();

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-950 to-zinc-950 p-6 text-white">
      <header className="mx-auto flex w-full max-w-xl items-center justify-between">
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← Volver al terrario
        </Link>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Respiración</h1>
          <p className="mt-1 text-sm text-white/60">
            Sigue el ritmo de la animación para enfocar tu mente.
          </p>
        </div>
        <MindfulnessGuide
          profileId={profile.id}
          hapticsEnabled={profile.hapticsEnabled}
        />
      </div>
    </main>
  );
}
