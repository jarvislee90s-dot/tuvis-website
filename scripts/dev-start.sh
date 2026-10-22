#!/usr/bin/env bash
# 一键启动 tuvis-website 本地开发服务（macOS / Linux）
# 用法：./scripts/dev-start.sh
# 可选环境变量：HOST=127.0.0.1 PORT=5173 NO_OPEN=1

set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR" || exit 1

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-5173}"
PID_FILE="$ROOT_DIR/.dev-server.pid"
LOG_FILE="$ROOT_DIR/.dev-server.log"
URL="http://${HOST}:${PORT}/zh/world"

if [ -f "$PID_FILE" ]; then
  OLD_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "${OLD_PID:-}" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "服务已在运行（PID ${OLD_PID}）：$URL"
    if [ "${NO_OPEN:-0}" != "1" ] && command -v open >/dev/null 2>&1; then
      open "$URL"
    fi
    exit 0
  fi
  rm -f "$PID_FILE"
fi

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "端口 $PORT 已被占用，无法启动。占用进程："
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN | sed -n '1,5p'
  echo "请先关闭占用进程，或换端口：PORT=5174 ./scripts/dev-start.sh"
  exit 1
fi

# 优先切到项目建议的 Node 22；没有 nvm 就沿用当前 node
if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  # shellcheck disable=SC1090
  . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  nvm use 22.23.2 >/dev/null 2>&1 || nvm use --silent 22 >/dev/null 2>&1 || true
fi

VITE_BIN="$ROOT_DIR/node_modules/.bin/vite"
if [ ! -x "$VITE_BIN" ]; then
  echo "未找到 node_modules，正在安装依赖（首次运行可能需要几分钟）..."
  export npm_config_manage_package_manager_versions=false
  if ! npx --yes pnpm@10.20.0 install --frozen-lockfile; then
    echo "依赖安装失败。请先安装 Node 22，或在终端运行："
    echo "  npm_config_manage_package_manager_versions=false npx --yes pnpm@10.20.0 install --frozen-lockfile"
    exit 1
  fi
fi

if [ ! -x "$VITE_BIN" ]; then
  echo "安装后仍未找到 node_modules/.bin/vite，无法启动。"
  exit 1
fi

echo "启动本地服务：$URL"
echo "日志：$LOG_FILE"
nohup "$VITE_BIN" --host "$HOST" --port "$PORT" --strictPort >"$LOG_FILE" 2>&1 &
PID=$!
echo "$PID" >"$PID_FILE"

READY=0
for _ in $(seq 1 60); do
  if ! kill -0 "$PID" 2>/dev/null; then
    break
  fi
  if curl -fsS "http://${HOST}:${PORT}/" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 0.5
done

if [ "$READY" -ne 1 ]; then
  echo "服务启动失败，日志末尾："
  tail -n 30 "$LOG_FILE" 2>/dev/null || true
  kill "$PID" 2>/dev/null || true
  rm -f "$PID_FILE"
  exit 1
fi

echo "服务已启动（PID ${PID}）。"
echo "关闭服务：双击 stop-dev.command，或运行 ./scripts/dev-stop.sh"
if [ "${NO_OPEN:-0}" != "1" ] && command -v open >/dev/null 2>&1; then
  open "$URL"
fi
