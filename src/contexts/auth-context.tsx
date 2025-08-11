'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

type AuthState = { loading: boolean; session: any; profile: any; isAdmin: boolean };
const AuthCtx = createContext<AuthState & { refresh: () => Promise<void>; signOut: () => Promise<void> }>({
  loading: true, session: null, profile: null, isAdmin: false, refresh: async () => {}, signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      if (data.session?.user?.id) {
        // IMPORTANT: use the correct table name that actually exists
        const { data: p, error } = await supabase
          .from('user_profiles')   // <-- not "profiles" if your table is user_profiles
          .select('full_name,is_admin')
          .eq('id', data.session.user.id)
          .maybeSingle();

        if (error) {
          console.warn('[auth] profile fetch error (non-fatal):', error.message);
          setProfile(null);
          setIsAdmin(false);
        } else {
          setProfile(p);
          setIsAdmin(Boolean(p?.is_admin));
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? null);
      // reload lightweight – do not block with timers
      load();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') window.location.assign('/login');
  };

  return (
    <AuthCtx.Provider value={{ loading, session, profile, isAdmin, refresh: load, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);