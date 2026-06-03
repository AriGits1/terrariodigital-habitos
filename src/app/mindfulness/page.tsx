import Link from "next/link";
import { getActiveProfile } from "@/features/profile/queries";
import MindfulnessGuide from "@/features/mindfulness/MindfulnessGuide";

export default async function MindfulnessPage() {
  const profile = await getActiveProfile();
  if (!profile) {
    return (
      <main className="flex h-screen items-center justify-center bg-zinc-900 text-white">
        <p>No hay perfil. Ejecutá el seed primero.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-950 to-zinc-950 p-6 text-white">
      <header className="mx-auto flex w-full max-w-xl items-center justify-between">
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← Volver al terrario
        </Link>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Mindfulness</h1>
          <p className="text-sm text-white/60">
            Seguí el ritmo. Respirá con el círculo.
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
