# DEPLOYMENT_RULES.md – Anoint Array

## Purpose
Non-negotiable rules for shipping **Anoint Array** with **Git + Vercel** (Next.js App Router).  
Claude Code **must** follow this document for every change and deployment.

---

## 1) Branching & Release Flow

- `main` = production only (protected).
- `develop` = integration branch (deploys to Preview).
- Feature work on `feat/*`; fixes on `fix/*`.
- Releases are **merge commits** from `develop → main` via PR.

**Required PR checks (blocking):**
- ✅ Typecheck: `pnpm ts:check`
- ✅ Lint: `pnpm lint`
- ✅ Unit tests (if present): `pnpm test`
- ✅ Route guard (no critical routes in `/prerender`): `pnpm check:critical-routes`
- ✅ Build: `pnpm build` (Next.js)

---

## 2) Vercel Environments & Env-Vars

- **Preview**: every PR → `NEXT_PUBLIC_SITE_URL` points to Vercel preview URL.
- **Production**: only `main`.

**Env vars (must exist in BOTH Preview & Production):**

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
SUPABASE_ADMIN_EMAIL
SUPABASE_ADMIN_PASSWORD
CANPOST_DEV_USERNAME
CANPOST_DEV_PASSWORD
CANPOST_PROD_USERNAME
CANPOST_PROD_PASSWORD
UPS_CLIENT_ID
UPS_SECRET
PAYPAL_CLIENT_ID_SANDBOX
PAYPAL_CLIENT_SECRET_SANDBOX
PAYPAL_CLIENT_ID_LIVE
PAYPAL_SECRET_LIVE
STRIPE_SECRET_KEY
STRIPE_PUBLISH_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
NOWPAYMENTS_PUBLIC_KEY
NOWPAYMENTS_API_KEY
FOURTHWALL_API_USERNAME
FOURTHWALL_API_PASSWORD
FOURTHWALL_STOREFRONT_TOKEN
VERCEL_API_TOKEN
VERCEL_USER_ID
VERCEL_PROJECT_ID
SEMGREP_APP_TOKEN
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
UPSTASH_PORT

**Rules**
- Never hardcode secrets or use `.env.local` in CI—sync via Vercel Env.
- MCP **vercel** tool only (no raw `vercel` CLI).
- If MCP says “token not valid,” stop and re-auth—no CLI fallback.

---

## 3) Next.js Rendering Policy

**NEVER** put critical routes under `/prerender` or statically export them.  
Protected dynamic routes include:

/login, /logout, /signup
/dashboard, /profile, /my-seals
/admin/**
/api/**

**Force dynamic rendering:**
```ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

4) Database & Migrations (Supabase)
	•	Migrations run before Production promote:
	1.	Apply to Preview DB.
	2.	Smoke test.
	3.	Apply to Production.
	•	Use Supabase MCP (not CLI) for all migrations, policy changes, triggers, and functions.
	•	Never commit raw service-role keys.
	•	If a key appears in git history, rotate immediately.

⸻

5) Caching, SW, and Asset Pitfalls
	•	Do not register a Service Worker for app routes unless scoped to static assets only.
	•	Ensure no HTML caching on auth pages.
	•	Favicons and manifest icons must be correct size to avoid warnings.
	•	For secure routes, always cache: 'no-store'.

⸻

6) Build & Deploy Steps (Claude Must Follow)
	1.	Verify tools
Use MCP: vercel, supabase, github, upstash.
	2.	Env audit in Vercel (Preview + Prod).
	3.	Critical route guard: pnpm check:critical-routes.
	4.	Typecheck + Lint + Tests.
	5.	Preview deploy (MCP) + smoke check.
	6.	DB migrations (Preview → Prod).
	7.	Promote to Production (MCP).
	8.	Post-deploy health check on core routes + webhooks.

⸻

7) Rollback & Hotfix
	•	Use Vercel MCP to alias previous successful deployment to Production.
	•	Hotfix: branch fix/* → PR to main (bypass develop if urgent).

⸻

8) Git Hygiene
	•	Enforce conventional commits (Husky + commitlint).
	•	No large assets (>10MB) in repo.
	•	Keep public/ static only.
	•	vercel.json minimal; no rewrites bypassing auth.

⸻

9) Guardrails (Scripts Claude Must Run)

package.json additions

{
  "scripts": {
    "ts:check": "tsc -p tsconfig.json --noEmit",
    "check:critical-routes": "node scripts/guard-critical-routes.js"
  }
}

scripts/guard-critical-routes.js
(Ensures protected pages never static — omitted for brevity.)

⸻

10) Breaking Change Policy — MUST READ
	•	NO breaking changes (database schema, API contracts, route structures, env var names, auth logic, or payment flows) without explicit personal authorization from Brad.
	•	Claude must stop and request approval before:
	•	Removing or renaming DB columns/tables.
	•	Modifying Supabase RLS policies for core tables.
	•	Altering /api/** request/response formats.
	•	Changing Next.js route paths for dashboard/admin/API.
	•	Adjusting payment integration logic or keys.
	•	Altering build config in a way that impacts runtime.

⸻

11) Post-Deploy Reporting

Claude must report after every deploy:
	•	✅ MCP calls used (names only, no secrets)
	•	✅ URLs checked + status codes
	•	✅ Env audit results
	•	✅ Critical route guard passed
	•	✅ DB migration summary
	•	✅ Confirmed “no breaking changes” unless explicitly approved