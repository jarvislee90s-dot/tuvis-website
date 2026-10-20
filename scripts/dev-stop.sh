#!/usr/bin/env bash
# 一键关闭 tuvis-website 本地开发服务（macOS / Linux）
# 用法：./scripts/dev-stop.sh

set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="$ROOT_DIR/.dev-server.pid"
PORT="${PORT:-5173}"

stop_pid() {
  local pid="$1"
  local cmd
  cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
  case "$cmd" in
    *vite*|*"$ROOT_DIR"*)
      pkill -P "$pid" 2>/dev/null || true
      kill "$pid" 2>/dev/null || true
      local i
      for i in $(seq 1 20); do
        if ! kill -0 "$pid" 2>/dev/null; then
          break
        fi
        sleep 0.2
      done
      if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null || true
      fi
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

if [ -f "$PID_FILE" ]; then
  PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  rm -f "$PID_FILE"
  if [ -n "${PID:-}" ] && kill -0 "$PID" 2>/dev/null; then
    if stop_pid "$PID"; then
      echo "服务已关闭（PID ${PID}）。"
      exit 0
    fi
    echo "PID ${PID} 不是本项目的 vite 进程，未关闭。"
    exit 1
  fi
fi

# PID 文件缺失时按端口兜底：只关闭命令行包含本仓库路径或 vite 的进程
PIDS="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$PIDS" ]; then
  for pid in $PIDS; do
    if stop_pid "$pid"; then
      echo "服务已关闭（PID ${pid}）。"
      exit 0
    fi
  done
  echo "端口 $PORT 有进程监听，但不是本项目的 vite，未关闭："
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN | sed -n '1,5p'
  exit 1
fi

echo "没有发现运行中的服务。"
