import Link from "next/link";
import { BarChart2 } from "lucide-react";
import { requireProfile } from "@/features/auth/guards";
import { logoutAction } from "@/features/auth/actions";
import SettingsForm from "@/features/settings/SettingsForm";
import PushNotificationToggle from "@/features/settings/PushNotificationToggle";
import type { BiomeType } from "@/features/biome/biome-logic";

export default async function ConfiguracionPage() {
  const profile = await requireProfile();

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 to-emerald-950 p-6 text-white">
      <header className="mx-auto mb-6 flex max-w-xl items-center justify-between">
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← Volver al terrario
        </Link>
        <form
          action={async () => {
            "use server";
            await logoutAction();
          }}
        >
          <button
            type="submit"
            className="rounded-lg bg-red-500/20 px-3 py-1 text-sm text-red-400 hover:bg-red-500/30 hover:text-red-300 transition"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <div className="mx-auto max-w-xl">
        <h1 className="mb-5 text-2xl font-semibold">Configuración</h1>
        <SettingsForm
          initial={{
            name: profile.name,
            biomeType: profile.biomeType as BiomeType,
            voiceEnabled: profile.voiceEnabled,
            hapticsEnabled: profile.hapticsEnabled,
            shareTerrarium: profile.shareTerrarium,
          }}
        />

        <div className="mt-5 flex items-center">
          <Link
            href="/analiticas"
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white/60 hover:bg-white/10 hover:text-white transition"
          >
            <BarChart2 className="h-4 w-4" />
            Ver mis analíticas
          </Link>
        </div>

        <PushNotificationToggle vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""} />
      </div>
    </main>
  );
}
