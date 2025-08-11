export const AUTH_STORAGE_VERSION = 'v2'; // bump to invalidate old localStorage
export const AUTH_STORAGE_KEY = `anoint-auth-${AUTH_STORAGE_VERSION}`;

export function purgeLegacySupabaseTokens() {
  try {
    // Supabase v2 localStorage keys look like: sb-<project-ref>-auth-token
    Object.keys(window.localStorage)
      .filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
      .forEach(k => localStorage.removeItem(k));
    // Our own namespaced keys (if any)
    localStorage.removeItem('anoint-auth-v1');
    localStorage.removeItem('anoint-auth-v0');
    // Clear any lingering cookies that might have been set by helpers
    document.cookie.split(';').forEach(c => {
      const name = c.split('=')[0].trim();
      if (name.startsWith('sb-') || name.startsWith('auth-') || name.includes('supabase')) {
        document.cookie = `${name}=; Max-Age=0; path=/`;
      }
    });
    // Mark current storage version
    localStorage.setItem(AUTH_STORAGE_KEY, String(Date.now()));
    console.info('[auth] Purged legacy Supabase tokens and cookies');
  } catch (e) {
    console.warn('[auth] purgeLegacySupabaseTokens failed', e);
  }
}