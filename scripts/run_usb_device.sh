#!/usr/bin/env bash
# Run Flutter on a USB-connected Android device against local v1 API (:5113).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${API_PORT:-5113}"
# Prefer adb reverse so the device uses 127.0.0.1 → host :5113
if command -v adb >/dev/null 2>&1; then
  adb reverse "tcp:${PORT}" "tcp:${PORT}" || true
fi
cd "$ROOT"
exec flutter run --dart-define="DEV_HOST=127.0.0.1" "$@"
