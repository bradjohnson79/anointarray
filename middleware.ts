import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { AuthCache } from "./lib/redis";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: "",
            ...options,
          });
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Check if the current path requires admin access
  if (req.nextUrl.pathname.startsWith("/admin")) {
    console.info("[middleware] Admin route accessed:", req.nextUrl.pathname);
    
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.info("[middleware] No valid session, redirecting to login");
        return NextResponse.redirect(new URL("/login", req.url));
      }
      
      console.info("[middleware] Valid session found, checking admin role for user:", session.user.id);
      
      // Check if user has admin role in database (using actual table structure)
      console.info("[middleware] Checking admin role for user:", session.user.id);
      
      // First, try cached admin check
      const cachedAdminStatus = await AuthCache.isUserAdmin(session.user.id);
      
      let isAdmin = false;
      
      if (cachedAdminStatus !== null) {
        console.info("[middleware] Using cached admin status:", cachedAdminStatus);
        isAdmin = cachedAdminStatus;
      } else {
        // Fallback to database query
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
      
        if (profileError) {
          console.error("[middleware] Profile fetch error:", profileError);
          
          // Fallback: Check if user is info@anoint.me (emergency admin access)
          if (session.user.email === 'info@anoint.me') {
            console.info("[middleware] Admin email fallback activated for info@anoint.me");
            isAdmin = true;
          } else {
            console.info("[middleware] Profile error - redirecting to member dashboard");
            return NextResponse.redirect(new URL("/dashboard", req.url));
          }
        } else {
          // Check role from actual database structure
          isAdmin = profile?.role === 'admin';
          
          // Cache the profile for future use
          if (profile) {
            await AuthCache.cacheUserProfile(session.user.id, profile);
          }
        }
      }
      
      // Check final admin status
      if (!isAdmin) {
        console.info("[middleware] User is not admin - redirecting to member dashboard");
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      
      console.info("[middleware] Admin access granted for:", session.user.email);
    } catch (error) {
      console.error("[middleware] Middleware error:", error);
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // For member dashboard, just ensure they're authenticated
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    console.info("[middleware] Member dashboard accessed");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.info("[middleware] No session for member dashboard, redirecting to login");
        return NextResponse.redirect(new URL("/login", req.url));
      }
      
      console.info("[middleware] Member dashboard access granted");
    } catch (error) {
      console.error("[middleware] Member dashboard check error:", error);
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return res;
}

export const config = { 
  matcher: ["/admin/:path*", "/dashboard/:path*"] 
};