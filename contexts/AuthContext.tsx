"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Simple, clean auth context interface
interface AuthContextType {
  user: any;
  loading: boolean;
  error?: string;
}

export const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true 
});

// Direct Supabase client for browser use
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { 
    auth: { 
      persistSession: true, 
      autoRefreshToken: true, 
      detectSessionInUrl: true 
    } 
  }
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let mounted = true;
    console.info("[AuthProvider] Initializing authentication...");

    // Hard timeout to prevent infinite loading
    const bailoutTimer = setTimeout(() => {
      if (mounted) {
        console.warn("[AuthProvider] Auth initialization timeout (6s) - stopping loading");
        setLoading(false);
      }
    }, 6000);

    // Get initial session
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        
        if (error) {
          console.error("[AuthProvider] Session error:", error);
          setError(error.message);
        } else {
          console.info("[AuthProvider] Initial session:", !!data?.session);
          setUser(data?.session?.user ?? null);
        }
        
        clearTimeout(bailoutTimer);
        setLoading(false);
      })
      .catch((e) => {
        if (mounted) {
          console.error("[AuthProvider] Session fetch failed:", e);
          setError(String(e));
          clearTimeout(bailoutTimer);
          setLoading(false);
        }
      });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      console.info("[AuthProvider] Auth state change:", event, !!session);
      setUser(session?.user ?? null);
      setError(undefined); // Clear any previous errors
      
      // Auth state changes should stop loading
      if (loading) {
        clearTimeout(bailoutTimer);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(bailoutTimer);
      subscription?.unsubscribe();
    };
  }, []); // Only run once on mount

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export supabase client for use in components
export { supabase };