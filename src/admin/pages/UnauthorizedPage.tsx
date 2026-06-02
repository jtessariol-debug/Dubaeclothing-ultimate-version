import { useState } from 'react';
import type { FormEvent } from 'react';
import { hasConfiguredLocalAdmin, signInWithLocalAdmin } from '../services/localAdminAuth';

export function UnauthorizedPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const result = signInWithLocalAdmin(email, password);
    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    window.location.href = '/admin/';
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-xl rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-sky-950/20">
        <p className="text-center text-xs uppercase tracking-[0.35em] text-sky-400">Admin</p>
        <h1 className="mt-4 text-center text-3xl font-semibold text-white">Admin access only</h1>
        <p className="mt-4 text-center text-sm text-slate-400">
          Inicia sesion con el correo y la contrasena autorizados en la configuracion local del proyecto.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSignIn}>
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Correo</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@tu-negocio.com"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Contrasena</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Tu contrasena"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500"
            />
          </label>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {errorMessage}
            </div>
          ) : null}

          {!hasConfiguredLocalAdmin() ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Configura `VITE_ADMIN_EMAIL` y `VITE_ADMIN_PASSWORD` en `.env.local`.
            </div>
          ) : null}

          <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Ingresando...' : 'Iniciar sesion'}
            </button>
            <a
              href="/"
              className="rounded-full border border-slate-700 px-5 py-3 text-center text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              Back to storefront
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
