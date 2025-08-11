'use client';
import { createClient } from '@supabase/supabase-js';
import { purgeLegacySupabaseTokens } from './auth-storage';

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (_client) return _client;

  purgeLegacySupabaseTokens(); // one-time cleanup on first import

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: { 'x-application-name': 'anointarray-web' },
    },
  });

  // Harden: if refresh fails with 400, sign out and force user to re-login.
  client.auth.onAuthStateChange(async (event, session) => {
    if (event === 'TOKEN_REFRESHED') return;
    if (event === 'SIGNED_OUT') return;
    // No-op: other events handled elsewhere
  });

  // Wrap getSession to catch refresh errors
  const origGetSession = client.auth.getSession.bind(client.auth);
  client.auth.getSession = async () => {
    try {
      return await origGetSession();
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg.includes('Invalid Refresh Token') || msg.includes('Refresh Token Not Found')) {
        console.warn('[auth] Invalid refresh token detected. Forcing signOut and reload.');
        await client.auth.signOut();
        if (typeof window !== 'undefined') window.location.replace('/login');
      }
      throw err;
    }
  };

  _client = client;
  return client;
}