"use client";

import { useState } from "react";
import { addSeedsAction, setStreakAction, sendPushAction } from "./actions";

type User = {
  id: string;
  name: string;
  email: string | null;
  seeds: number;
  currentStreak: number;
};

export default function AdminCheatTools({ users }: { users: User[] }) {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || "");
  const [loading, setLoading] = useState(false);

  async function handleAddSeeds(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) return;
    setLoading(true);
    const res = await addSeedsAction(selectedUserId, 100);
    if (res.success) alert("¡100 🌱 añadidas con éxito!");
    setLoading(false);
  }

  async function handleSetStreak(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedUserId) return;
    const fd = new FormData(e.currentTarget);
    const days = parseInt(fd.get("days") as string, 10);
    if (isNaN(days)) return;
    
    setLoading(true);
    const res = await setStreakAction(selectedUserId, days);
    if (res.success) alert(`Racha establecida en ${days} 🔥`);
    setLoading(false);
  }

  async function handleSendPush(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedUserId) return;
    const fd = new FormData(e.currentTarget);
    const title = fd.get("title") as string;
    const body = fd.get("body") as string;
    
    setLoading(true);
    const res = await sendPushAction(selectedUserId, title, body);
    if (res.success) {
      alert("Notificación enviada correctamente.");
    } else {
      alert(res.error);
    }
    setLoading(false);
  }

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <section className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 mt-8">
      <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
        <span className="text-xl">🛠️</span> Herramientas de Administrador (Cheat Tools)
      </h2>
      
      <div className="mb-6 flex flex-col gap-2">
        <label className="text-sm text-white/70">Seleccionar Usuario Destino</label>
        <select 
          value={selectedUserId} 
          onChange={e => setSelectedUserId(e.target.value)}
          className="rounded-xl bg-white/10 px-4 py-2 text-white outline-none ring-1 ring-white/20 focus:ring-emerald-400"
        >
          {users.map(u => (
            <option key={u.id} value={u.id} className="bg-zinc-800">
              {u.name} {u.email ? `(${u.email})` : ""}
            </option>
          ))}
        </select>

        {selectedUser && (
          <div className="mt-2 text-xs text-white/50 flex gap-4">
            <span>Semillas actuales: <strong className="text-emerald-400">{selectedUser.seeds} 🌱</strong></span>
            <span>Racha actual: <strong className="text-orange-400">{selectedUser.currentStreak} 🔥</strong></span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Seeds Tool */}
        <div className="flex flex-col gap-3 rounded-xl bg-black/20 p-4 ring-1 ring-white/5">
          <h3 className="font-medium text-sm">Añadir Semillas</h3>
          <p className="text-xs text-white/50 leading-relaxed">Otorga semillas instantáneas para comprar en la tienda de decoraciones.</p>
          <button 
            onClick={handleAddSeeds}
            disabled={loading || !selectedUserId}
            className="mt-auto rounded-lg bg-emerald-600 py-2 text-sm font-semibold hover:bg-emerald-500 transition disabled:opacity-50"
          >
            +100 🌱 Semillas
          </button>
        </div>

        {/* Streak Tool */}
        <form onSubmit={handleSetStreak} className="flex flex-col gap-3 rounded-xl bg-black/20 p-4 ring-1 ring-white/5">
          <h3 className="font-medium text-sm">Modificar Racha</h3>
          <p className="text-xs text-white/50 leading-relaxed">Fija los días consecutivos. Pon 0 para quitar la racha.</p>
          <input 
            type="number" 
            name="days" 
            required 
            min="0"
            defaultValue="5"
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-white/20 focus:ring-orange-400"
          />
          <button 
            type="submit"
            disabled={loading || !selectedUserId}
            className="mt-auto rounded-lg bg-orange-600 py-2 text-sm font-semibold hover:bg-orange-500 transition disabled:opacity-50"
          >
            Aplicar Racha 🔥
          </button>
        </form>

        {/* Push Tool */}
        <form onSubmit={handleSendPush} className="flex flex-col gap-3 rounded-xl bg-black/20 p-4 ring-1 ring-white/5">
          <h3 className="font-medium text-sm">Enviar Web Push</h3>
          <p className="text-xs text-white/50 leading-relaxed">Dispara una notificación push manual a este usuario.</p>
          <input 
            type="text" 
            name="title" 
            required 
            defaultValue="Mensaje del Admin"
            placeholder="Título"
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-white/20 focus:ring-blue-400"
          />
          <input 
            type="text" 
            name="body" 
            required 
            defaultValue="¡Tienes nuevas semillas en tu cuenta!"
            placeholder="Mensaje"
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-white/20 focus:ring-blue-400"
          />
          <button 
            type="submit"
            disabled={loading || !selectedUserId}
            className="mt-auto rounded-lg bg-blue-600 py-2 text-sm font-semibold hover:bg-blue-500 transition disabled:opacity-50"
          >
            Enviar Push 🔔
          </button>
        </form>
      </div>
    </section>
  );
}
