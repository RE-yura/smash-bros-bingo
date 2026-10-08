#!/usr/bin/env bash
# ブラウザ確認をまとめて実行する
#   scripts/e2e/run.sh          本番ビルドを作り、vp preview（/smash-bros-bingo/）に対して実行する
#   scripts/e2e/run.sh <URL>    指定した URL（例: https://re-yura.github.io/smash-bros-bingo/）に対して実行する
set -euo pipefail
cd "$(dirname "$0")/../.."

if [ $# -ge 1 ]; then
  base="$1"
else
  port="${E2E_PORT:-4173}"
  vp build
  vp preview --port "$port" --strictPort > /dev/null 2>&1 &
  server=$!
  # vp は node の子プロセスでサーバーを動かすので、子プロセスごと止める
  trap 'pkill -P "$server" 2>/dev/null || true; kill "$server" 2>/dev/null || true' EXIT
  base="http://localhost:$port/smash-bros-bingo/"
  for _ in $(seq 1 80); do
    curl -sf -o /dev/null "$base" && break
    sleep 0.25
  done
fi

status=0
for script in check names-fit stale-fallback scroll; do
  echo "== $script"
  node "scripts/e2e/$script.cjs" "$base" || status=1
done
exit "$status"
