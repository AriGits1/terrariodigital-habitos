export default function Loading() {
  return (
    <main className="flex h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-zinc-900 to-emerald-950">
      {/* Animated terrarium loader */}
      <div className="relative flex items-end justify-center gap-2" style={{ height: 64 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="block w-2.5 rounded-full bg-emerald-400"
            style={{
              height: `${20 + i * 8}px`,
              animation: `loading-bar 1.1s ease-in-out ${i * 0.12}s infinite alternate`,
              opacity: 0.7 + i * 0.06,
            }}
          />
        ))}
      </div>

      <p className="text-sm text-white/50 tracking-widest uppercase">Cargando…</p>

      <style>{`
        @keyframes loading-bar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </main>
  );
}
