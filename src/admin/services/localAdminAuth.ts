import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getConfiguredAdminEmail() {
  return normalizeEmail(import.meta.env.VITE_ADMIN_EMAIL ?? '');
}

export function hasConfiguredLocalAdmin() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export async function signInWithLocalAdmin(email: string, password: string) {
  const configuredEmail = getConfiguredAdminEmail();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  const session = data.session;
  console.log('Admin session:', session);
  console.log('Admin email:', session?.user?.email);

  if (!session?.user?.email) {
    return {
      ok: false,
      error: 'No admin session was created.',
    };
  }

  if (configuredEmail && normalizeEmail(session.user.email) !== configuredEmail) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: 'This account is not allowed to access the admin panel.',
    };
  }

  return { ok: true, error: null };
}

export async function getAdminSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Admin session error:', error);
    return null;
  }

  const session = data.session;
  console.log('Admin session:', session);
  console.log('Admin email:', session?.user?.email);
  return session;
}

export function isSupabaseAdminSession(session: Session | null) {
  const configuredEmail = getConfiguredAdminEmail();
  const sessionEmail = normalizeEmail(session?.user?.email ?? '');

  if (!sessionEmail) {
    return false;
  }

  if (configuredEmail) {
    return sessionEmail === configuredEmail;
  }

  return true;
}

export async function clearLocalAdminSession() {
  await supabase.auth.signOut();
}
