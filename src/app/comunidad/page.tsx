import Link from "next/link";
import { Users } from "lucide-react";
import { requireProfile } from "@/features/auth/guards";
import { listCohort, getInbox } from "@/features/social/queries";
import { markEncouragementRead } from "@/features/social/actions";

export default async function ComunidadPage() {
  const viewer = await requireProfile();

  const [cohort, inbox] = await Promise.all([
    listCohort(viewer.id),
    getInbox(viewer.id),
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 to-emerald-950 p-6 text-white">
      <header className="mx-auto mb-6 flex max-w-2xl items-center justify-between">
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← Volver al terrario
        </Link>
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Users className="h-5 w-5" />
          Comunidad
        </h1>
      </header>

      <div className="mx-auto max-w-2xl flex flex-col gap-8">
        {/* Cohort member list */}
        <section>
          <h2 className="mb-3 text-lg font-medium text-white/80">Terrários activos</h2>
          {cohort.length === 0 ? (
            <p className="rounded-xl bg-white/5 p-6 text-sm text-white/50 text-center">
              Nadie ha activado su terrario aún. Activá el tuyo en Configuración para aparecer aquí.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {cohort.map((member) => (
                <li key={member.id}>
                  <Link
                    href={`/comunidad/${member.id}`}
                    className="flex items-center justify-between rounded-xl bg-white/5 p-4 hover:bg-white/10 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-white/50 capitalize">{member.biomeType}</p>
                    </div>
                    <div className="flex gap-4 text-right">
                      <div>
                        <p className="text-xs text-white/40">Racha</p>
                        <p className="text-sm font-semibold text-emerald-400">{member.streak}d</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40">Salud</p>
                        <p className="text-sm font-semibold">{member.health}%</p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Inbox */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-medium text-white/80">
            Bandeja de alientos
            {inbox.unreadCount > 0 && (
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-black">
                {inbox.unreadCount}
              </span>
            )}
          </h2>
          {inbox.items.length === 0 ? (
            <p className="rounded-xl bg-white/5 p-6 text-sm text-white/50 text-center">
              Tu bandeja está vacía. Visitá un terrario para enviar aliento.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {inbox.items.map((item) => (
                <li
                  key={item.id}
                  className={`rounded-xl p-4 ${item.read ? "bg-white/5" : "bg-emerald-900/30 ring-1 ring-emerald-500/30"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium text-emerald-400">{item.fromName}</span>
                        {" "}
                        {item.type === "water" ? "te envió agua" : "te envió kudos"}
                      </p>
                      {item.message && (
                        <p className="mt-1 text-sm text-white/70 italic">{item.message}</p>
                      )}
                      <p className="mt-1 text-xs text-white/30">
                        {new Date(item.createdAt).toLocaleDateString("es", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    {!item.read && (
                      <form
                        action={async () => {
                          "use server";
                          await markEncouragementRead(item.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="shrink-0 rounded-lg bg-white/10 px-2 py-1 text-xs text-white/60 hover:bg-white/20 transition"
                        >
                          Marcar leído
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
