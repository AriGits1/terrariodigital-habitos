"use client";

const STORAGE_KEY = "terrario_tour_done_v1";

export default function ReplayTourButton() {
  function handleClick() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {/* ignore */}
    window.location.reload();
  }

  return (
    <button
      onClick={handleClick}
      title="Ver tutorial"
      aria-label="Relanzar tutorial"
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white/60 hover:bg-white/25 hover:text-white backdrop-blur-md shadow-lg transition-all text-sm font-bold"
    >
      ?
    </button>
  );
}
