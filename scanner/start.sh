#!/bin/sh
# Start ClamAV (the official image's init downloads signatures, then runs
# freshclam updates and clamd), wait until clamd answers, then run the API.
set -e

/init &

echo "Waiting for clamd (first start downloads signatures; this can take a few minutes)..."
until printf 'zPING\0' | nc -w 2 "${CLAMD_HOST:-127.0.0.1}" "${CLAMD_PORT:-3310}" 2>/dev/null | grep -q PONG; do
  sleep 5
done
echo "clamd is ready."

exec node /app/server.mjs
