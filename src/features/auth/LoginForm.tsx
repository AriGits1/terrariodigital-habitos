"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import PasswordInputWithToggle from "./PasswordInputWithToggle";

type FormState = { error: string } | undefined;

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    loginAction,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="email"
          className="text-sm font-medium text-white/70"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-xl bg-white/10 px-4 py-2 text-white placeholder-white/40 outline-none ring-1 ring-white/20 focus:ring-emerald-400"
          placeholder="admin@terrario.local"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="password"
          className="text-sm font-medium text-white/70"
        >
          Contraseña
        </label>
        <PasswordInputWithToggle
  		 id="password"
  		 name="password"
 		 required
  		 autoComplete="current-password"
  		 placeholder="••••••••"
	   />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-xl bg-emerald-500 py-2 font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-60"
      >
        {isPending ? "Iniciando sesión…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
