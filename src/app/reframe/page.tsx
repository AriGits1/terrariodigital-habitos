import Link from "next/link";
import ReframeCard from "@/features/reframe/ReframeCard";

export default function ReframePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 to-emerald-950 p-6 text-white">
      <header className="mx-auto mb-6 flex max-w-xl items-center justify-between">
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← Volver al terrario
        </Link>
      </header>
      <div className="mx-auto max-w-xl">
        <ReframeCard />
      </div>
    </main>
  );
}
