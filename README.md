# MineBeacon — каталог Minecraft-серверов

Fullstack: **Next.js 14 (App Router) + PostgreSQL + Prisma**. Тёмная тема по умолчанию (зелёные акценты), светлая по переключателю. i18n RU/EN. Порт **8096**.

## Возможности
- Регистрация login/email+пароль (bcrypt), verify e-mail (если SMTP настроен), восстановление пароля.
- OAuth Google/GitHub (включаются в админке), Telegram Login Widget (HMAC + auth_date 24ч).
- Привязка/отвязка аккаунтов в кабинете. Сессии httpOnly+SameSite cookie, CSRF double-submit, rate-limit (memory + Redis опционально).
- Серверы: CRUD, Markdown с санитизацией, лого/баннер (тип+размер), Java/Bedrock/Both, теги, PUBLIC/PRIVATE, whitelist-вопросы, Server List Ping (`minecraft-server-util`) фоновой задачей.
- Каталог: поиск, фильтры версия/режим/редакция/доступ/онлайн, сортировка (голоса/онлайн/новые), пагинация.
- Голосование: только авторизованные, 1 голос/сервер/интервал (настраивается), антиабуз IP+user+rate-limit, опционально Turnstile, владелец не голосует за свой, топ месяца + общий.
- Whitelist-заявки: pending→approved/rejected, одна активная на сервер, revoke, массовые действия, экспорт `whitelist.json`, e-mail + внутренние уведомления (колокольчик).
- Админка: пользователи, серверы, голоса, заявки, audit log, статистика по дням, настройки в БД без перезапуска (секреты AES-256-GCM, маска, пустое поле не затирает, тестовое письмо SMTP).
- Безопасность: helmet-заголовки, zod-валидация, Prisma (SQL-инъекции закрыты), права на каждом эндпоинте, audit. За reverse proxy (Traefik/Nginx) читаются `X-Forwarded-*`.

## Дерево проекта
```
minebeacon/
  Dockerfile  docker-compose.yml  .env.example  entrypoint.sh
  package.json  tsconfig.json  next.config.js  next-env.d.ts
  prisma/schema.prisma
  scripts/ensure-admin.js
  public/uploads/.gitkeep
  src/
    app/layout.tsx  page.tsx  globals.css
    app/servers/page.tsx  app/servers/[id]/page.tsx
    app/servers/new/page.tsx  app/servers/[id]/edit/page.tsx
    app/servers/[id]/applications/page.tsx
    app/login/page.tsx  register/page.tsx  forgot/page.tsx  reset/page.tsx  verify/page.tsx
    app/profile/page.tsx  app/admin/page.tsx
    app/api/health/route.ts
    app/api/auth/... (register,login,logout,me,forgot,reset,verify,csrf,oauth/[provider],callback/[provider],telegram,accounts)
    app/api/servers/route.ts  app/api/servers/[id]/route.ts
    app/api/servers/[id]/vote/route.ts  app/api/servers/[id]/applications/route.ts
    app/api/servers/[id]/whitelist-export/route.ts
    app/api/applications/mine/route.ts  app/api/applications/[appId]/route.ts
    app/api/me/servers/route.ts  app/api/me/password/route.ts
    app/api/upload/route.ts  app/api/settings/public/route.ts
    app/api/admin/... (settings, settings/test-smtp, users, users/[id], votes, servers, servers/[id]/reset-votes, applications, audit, stats)
    app/api/notifications/route.ts  app/api/cron/ping/route.ts
    lib/ (prisma, api, session, crypto-settings, settings, password, rate-limit, audit, mailer, markdown, telegram, mc-ping, validators, client)
    components/ (Providers, Header, ServerCard, ServerForm)
    i18n/dict.ts
```

## Быстрый запуск
```bash
cp .env.example .env
# поправьте SESSION_SECRET, SETTINGS_ENCRYPTION_KEY (32 байта hex), ADMIN_LOGIN/ADMIN_PASSWORD
docker compose up -d --build
# сайт: http://localhost:8096
docker compose logs -f app
```
Миграции (`prisma migrate deploy`) и создание админа (`scripts/ensure-admin.js`) выполняются автоматически в `entrypoint.sh`. Пароль админа только хеш, при первом входе — плашка «смените пароль».

`.env`:
```
DATABASE_URL=postgresql://minebeacon:minebeacon@db:5432/minebeacon?schema=public
SESSION_SECRET=...  APP_URL=http://localhost:8096
SETTINGS_ENCRYPTION_KEY=... (hex 64)
ADMIN_LOGIN=Rudenis  ADMIN_PASSWORD=Denis2608!
CRON_SECRET=...
```

## Первичная настройка в админке (/admin → settings)
1. **Google**: console.cloud.google.com → APIs & Services → Credentials → OAuth client (Web). Authorized redirect URI = `APP_URL/api/auth/callback/google` (подсказан в админке). Вставьте Client ID/Secret, включите. Кнопка появится на /login.
2. **GitHub**: github.com → Settings → Developer settings → OAuth Apps → New. Authorization callback URL = `APP_URL/api/auth/callback/github`. Вставьте ID/Secret, включите.
3. **Telegram**: BotFather → /newbot → username+токен. /setdomain → домен из APP_URL. В админке включите, укажите username (без @) и токен. Виджет подтянется на /login.
4. **SMTP**: вкладка SMTP — хост/порт/шифрование none|starttls|ssl, логин/пароль, from. «Отправить тестовое письмо» покажет OK/ошибку. Без SMTP verify e-mail авто-подтверждается, сброс пароля пишет ссылку в лог очереди (таблица EmailQueue видна через audit/DB).
5. **Уведомления**: флаги + шаблоны с `{server_name} {player_nick} {contact} {status} {comment}`.
6. **Голосование**: интервал часов, Turnstile site/secret + вкл/выкл, лимит IP/день.
7. **Общие**: название, описание, contact e-mail, вкл/выкл регистрации.

## Бэкап БД
```bash
docker compose exec db pg_dump -U minebeacon minebeacon > backup_$(date +%F).sql
# восстановить:
cat backup.sql | docker compose exec -T db psql -U minebeacon minebeacon
# volume pgdata хранит данные между перезапусками
```

## Обновление
```bash
git pull  # или распакуйте новую версию
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

## Reverse proxy (Traefik/Nginx)
Пробрасывайте `X-Forwarded-For/Proto/Host`. `APP_URL` должен быть внешним https-URL — от него зависят secure-cookie, OAuth callback и ссылки в письмах. Пример Nginx:
```
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_pass http://127.0.0.1:8096;
```

## Порты/здоровье
- App: 8096:8096, `/api/health` (DB ping). `restart: unless-stopped`, healthcheck в compose+Dockerfile. Запуск от пользователя `app` (не root).
- Redis опционален (кеш/rate-limit): при отсутствии `REDIS_URL` используется in-memory лимитер.
