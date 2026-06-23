import { notFound } from "next/navigation";
import Link from "next/link";
import { requireProfile } from "@/features/auth/guards";
import { getVisitData } from "@/features/social/queries";
import BiomeSceneWrapper from "@/features/biome/BiomeSceneWrapper";
import EncouragementForm from "@/features/social/EncouragementForm";

export default async function Page(props: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await props.params;

  // Authenticate viewer (result is discarded — we only need to confirm session exists)
  await requireProfile();

  // S1: gate via WHERE { id, shareTerrarium: true } — notFound() if null
  const data = await getVisitData(profileId);
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 to-emerald-950 text-white">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4">
        <Link href="/comunidad" className="rounded-full bg-black/30 px-3 py-1 text-sm text-white/70 backdrop-blur-sm hover:text-white">
          ← Comunidad
        </Link>
        <p className="rounded-full bg-black/30 px-3 py-1 text-sm text-white/80 backdrop-blur-sm">
          {data.name}
        </p>
      </header>

      {/* Read-only 3D terrarium — S2: readOnly disables all mutation paths */}
      <div className="h-[60dvh] w-full">
        <BiomeSceneWrapper type={data.biomeType} habits={data.habits} readOnly />
      </div>

      <div className="mx-auto max-w-xl p-6">
        {/* Encouragement form — S3/S4 enforced server-side in sendEncouragement */}
        <EncouragementForm
          toProfileId={profileId}
          recipientName={data.name}
          biomeType={data.biomeType}
        />
      </div>
    </main>
  );
}
