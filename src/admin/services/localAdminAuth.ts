const ADMIN_SESSION_KEY = 'dubae_admin_session';

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function hasConfiguredLocalAdmin() {
  return Boolean(import.meta.env.VITE_ADMIN_EMAIL && import.meta.env.VITE_ADMIN_PASSWORD);
}

export function signInWithLocalAdmin(email: string, password: string) {
  const configuredEmail = normalizeEmail(import.meta.env.VITE_ADMIN_EMAIL ?? '');
  const configuredPassword = import.meta.env.VITE_ADMIN_PASSWORD ?? '';

  if (!configuredEmail || !configuredPassword) {
    return {
      ok: false,
      error: 'Faltan VITE_ADMIN_EMAIL o VITE_ADMIN_PASSWORD en .env.local.',
    };
  }

  if (normalizeEmail(email) !== configuredEmail || password !== configuredPassword) {
    return {
      ok: false,
      error: 'Credenciales invalidas.',
    };
  }

  localStorage.setItem(
    ADMIN_SESSION_KEY,
    JSON.stringify({
      email: configuredEmail,
      signedInAt: new Date().toISOString(),
    }),
  );

  return { ok: true, error: null };
}

export function isLocalAdminAuthenticated() {
  const session = localStorage.getItem(ADMIN_SESSION_KEY);
  return Boolean(session);
}

export function clearLocalAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}
