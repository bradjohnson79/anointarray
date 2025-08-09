#!/bin/bash
# === FORCE VERCEL PROD DEPLOY + VERIFY LIVE IS NEW ===
set -euo pipefail

echo "1) Ensure we're on the main branch with latest commits"
git fetch --all --prune
git checkout main
git pull --ff-only

echo "2) Make a no-op change to guarantee a new build (bust any stale cache)"
TS=$(date +%Y%m%d-%H%M%S)
echo "// redeploy ${TS}" > .vercel-redeploy-${TS}.txt
git add .vercel-redeploy-${TS}.txt
git commit -m "chore: force redeploy ${TS}"

echo "3) Verify Vercel project link & env"
vercel --version
vercel link --yes --confirm || true
# Pull prod env (so build matches prod)
vercel pull --yes --environment=production

echo "4) Trigger a fresh production build (force, no cache)"
BUILD_META="build_forced=${TS}"
DEPLOY_URL=$(vercel deploy --prod --force --meta "${BUILD_META}" | tail -n1)
echo "New deployment: ${DEPLOY_URL}"

echo "5) Point the production alias to the new deployment"
vercel alias set "${DEPLOY_URL}" anointarray.com

echo "6) Smoke-check: fetch login bundle + root HTML from prod"
sleep 8
curl -sS https://anointarray.com/ -D - | sed -n '1,20p'
# Grab a likely login/page chunk (adjust if filename differs)
curl -sS https://anointarray.com/_next/static/chunks/pages/auth.js -o /tmp/auth.js || true
curl -sS https://anointarray.com/_next/static/chunks/pages/login.js -o /tmp/login.js || true

echo "7) Assert the old redirect string is GONE in live JS"
if grep -R "router\\.replace('/admin')" /tmp/auth.js /tmp/login.js 2>/dev/null; then
  echo "❌ Old redirect still present in live bundle. Investigate SW/CDN caching."
  EXIT_CODE=1
else
  echo "✅ Old redirect not found in live bundle."
  EXIT_CODE=0
fi

echo "8) (Optional) Disable/refresh any stale Service Worker by bumping version env"
# If your app registers a SW via NEXT_PUBLIC_SW_VERSION, bump it and redeploy once more
if grep -R "navigator.serviceWorker" -n ./ 1>/dev/null 2>&1; then
  echo "NEXT_PUBLIC_SW_VERSION=${TS}" >> .env.production.local
  git add .env.production.local
  git commit -m "chore: bump SW version ${TS}" || true
  DEPLOY_URL2=$(vercel deploy --prod --force --meta "sw_bump=${TS}" | tail -n1)
  vercel alias set "${DEPLOY_URL2}" anointarray.com
  echo "SW bump deployed: ${DEPLOY_URL2}"
fi

echo "9) Verify runtime logs just after deploy (look for auth redirects)"
vercel logs anointarray.com --since 10m --prod || true

echo "10) Final: open the site for manual check"
echo "Open https://anointarray.com/login in an incognito window."
echo "Expected:"
echo " - No console logs showing old [login] Executing router.replace"
echo " - Admin login lands on /admin/dashboard (handled by AuthContext only)"
echo " - Member login lands on /member/dashboard"

exit ${EXIT_CODE}