# check-frontend.sh
set -e
required_dirs=("app" "pages" "public" "components" "src")
for d in "${required_dirs[@]}"; do
  if [ ! -d "$d" ]; then
    echo "❌ Missing critical frontend directory: $d"
    exit 1
  fi
done
echo "✅ Frontend structure intact"