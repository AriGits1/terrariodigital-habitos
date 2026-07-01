"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Droplets } from "lucide-react";
import { waterTheBiome } from "./water-actions";

const WATER_POUR_AMOUNT = 10;

export default function WaterControl({ waterBalance }: { waterBalance: number }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleWater() {
    setPending(true);
    const res = await waterTheBiome(WATER_POUR_AMOUNT);
    setPending(false);
    if (!res.success) {
      alert(res.error || "Error al regar el bioma.");
    } else {
      router.refresh();
    }
  }

  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-black/30 px-3 py-2 backdrop-blur-sm md:px-4 md:py-3">
      <span
        className="flex items-center gap-1.5 text-xs font-semibold text-sky-300 md:text-sm"
        title="Agua disponible para regar el bioma"
      >
        <Droplets className="h-3.5 w-3.5 md:h-4 md:w-4" />
        {waterBalance} 💧
      </span>

      {waterBalance > 0 ? (
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-sky-400/30 animate-ping" />
          <button
            disabled={pending}
            onClick={handleWater}
            className="relative rounded-full px-3 py-1 text-xs font-semibold bg-sky-400 text-black hover:bg-sky-300 disabled:opacity-60 transition"
            title={`Gasta ${WATER_POUR_AMOUNT} 💧 para aumentar el crecimiento y la salud`}
          >
            Regar
          </button>
        </div>
      ) : (
        <span className="text-xs text-white/40">
          Sin agua — ve a la Tienda
        </span>
      )}
    </div>
  );
}
