import { supabase } from "../lib/supabaseClient"

export const handleSignUp = async (email, password) => {
  try {
    console.log("🚀 Attempting sign-up for:", email)
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      console.error("❌ Sign-up failed:", error.message)
      return
    }

    let session = data.session
    const user = data.user

    if (!session && user) {
      console.warn("⚠️ No session returned after sign-up, attempting fallback login...")

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (loginError) {
        console.error("❌ Fallback login failed:", loginError.message)
        return
      }

      session = loginData.session
    }

    if (session) {
      console.log("✅ Auth successful, redirecting...")
      window.location.href = "/dashboard" // 👈 Replace with correct post-auth route
    } else {
      console.error("❌ Session still missing after fallback.")
    }
  } catch (err) {
    console.error("🔥 Unexpected error during sign-up:", err.message)
  }
}