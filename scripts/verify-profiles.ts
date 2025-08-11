import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supa = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

  const table = 'user_profiles'; // change if your schema differs

  // Check table existence by a cheap select
  const { error: probeErr } = await supa.from(table).select('id').limit(1);
  if (probeErr) {
    console.error(`[verify] Table ${table} not reachable:`, probeErr.message);
    process.exit(1);
  } else {
    console.log(`[verify] Table ${table} OK`);
  }

  // Ensure admin row exists for your admin email:
  const adminEmail = process.env.SUPABASE_ADMIN_EMAIL!;
  const { data: user } = await supa.auth.admin.listUsers();
  const admin = user?.users?.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());
  if (!admin) {
    console.warn('[verify] Admin auth user not found. Create it first.');
    process.exit(1);
  }

  const { data: prof, error: profErr } = await supa.from(table).select('*').eq('id', admin.id).maybeSingle();
  if (profErr) console.error('[verify] profile query error:', profErr.message);

  if (!prof) {
    console.log('[verify] creating admin profile row…');
    const { error: insErr } = await supa.from(table).insert({ id: admin.id, full_name: 'Admin', is_admin: true });
    if (insErr) {
      console.error('[verify] failed to insert admin profile:', insErr.message);
      process.exit(1);
    } else {
      console.log('[verify] admin profile created.');
    }
  } else if (!prof.is_admin) {
    console.log('[verify] updating profile to is_admin=true…');
    const { error: updErr } = await supa.from(table).update({ is_admin: true }).eq('id', admin.id);
    if (updErr) console.error('[verify] update failed:', updErr.message);
  } else {
    console.log('[verify] admin profile already present and admin.');
  }
}

main().catch(e => { console.error(e); process.exit(1); });