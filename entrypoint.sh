#!/bin/sh
set -e
echo "[entrypoint] waiting for db..."
npx prisma migrate deploy || true
npx prisma db push
node scripts/ensure-admin.js
# фоновый пинг/почта каждые 2 минуты (cron внутри контейнера без supervisor — простой цикл)
( while true; do
    sleep 120
    wget -qO- --header="x-cron-secret: ${CRON_SECRET:-}" "http://127.0.0.1:${PORT:-8096}/api/cron/ping?secret=${CRON_SECRET:-}" || true
  done ) &
echo "[entrypoint] starting app on ${PORT:-8096}..."
exec npm run start
