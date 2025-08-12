#!/bin/bash
set -e

echo "=== ANOINT Global Type Safety Rule ==="

# 1) Shared scripts
npm pkg set scripts.typecheck="tsc --noEmit"
npm pkg set scripts.lint="eslint 'src/**/*.{ts,tsx}'"
npm pkg set scripts.fix="eslint 'src/**/*.{ts,tsx}' --fix"
npm pkg set scripts.check="pnpm typecheck && pnpm lint"

# 2) Husky + lint-staged (block bad commits)
pnpm add -D husky lint-staged
npm pkg set lint-staged.'*.{ts,tsx,cts,mts}'="eslint --fix"
npm pkg set lint-staged.'*.{js,jsx,cjs,mjs}'="eslint --fix"
npm pkg set lint-staged.'**/*'="prettier --write"
pnpm dlx husky init
cat > .husky/pre-commit <<'EOF'
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

echo "Pre-commit: lint-staged + typecheck (fast)"
pnpm lint-staged

# fast typecheck on changed TS files (fallback to full if none detected)
CHANGED_TS=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|mts|cts)$' || true)
if [ -n "$CHANGED_TS" ]; then
  echo "$CHANGED_TS" | xargs pnpm tsc -p tsconfig.json --noEmit --pretty false
else
  pnpm tsc --noEmit --pretty false
fi
EOF
chmod +x .husky/pre-commit

# 3) Pre-push gate (full check)
cat > .husky/pre-push <<'EOF'
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

echo "Pre-push: full typecheck + lint"
pnpm typecheck && pnpm lint
EOF
chmod +x .husky/pre-push

# 4) CI (GitHub Actions) — blocks merges if red
mkdir -p .github/workflows
cat > .github/workflows/quality.yml <<'YML'
name: Quality
on:
  pull_request:
  push:
    branches: [main]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
YML

# 5) Editor defaults (keep devs consistent)
cat > .editorconfig <<'EOF'
root = true
[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
EOF

# 6) VS Code nudges (optional but helpful)
mkdir -p .vscode
cat > .vscode/settings.json <<'JSON'
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.formatOnSave": true,
  "eslint.validate": ["typescript", "typescriptreact", "javascript", "javascriptreact"],
  "editor.codeActionsOnSave": { "source.fixAll.eslint": true }
}
JSON

echo "=== Global rule wired: pre-commit, pre-push, and CI now enforce TS correctness ==="