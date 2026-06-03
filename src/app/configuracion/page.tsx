import Link from "next/link";
import { getActiveProfile } from "@/features/profile/queries";
import SettingsForm from "@/features/settings/SettingsForm";
import type { BiomeType } from "@/features/biome/biome-logic";

export default async function ConfiguracionPage() {
  const profile = await getActiveProfile();
  if (!profile) {
    return (
      <main className="flex h-screen items-center justify-center bg-zinc-900 text-white">
        <p>No hay perfil. Ejecutá el seed primero.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 to-emerald-950 p-6 text-white">
      <header className="mx-auto mb-6 flex max-w-xl items-center justify-between">
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← Volver al terrario
        </Link>
      </header>

      <div className="mx-auto max-w-xl">
        <h1 className="mb-5 text-2xl font-semibold">Configuración</h1>
        <SettingsForm
          profileId={profile.id}
          initial={{
            name: profile.name,
            biomeType: profile.biomeType as BiomeType,
            voiceEnabled: profile.voiceEnabled,
            hapticsEnabled: profile.hapticsEnabled,
          }}
        />
      </div>
    </main>
  );
}
