# Дукон — Telegram Mini App Marketplace

Бозори бисёрфурӯшандагӣ дар дохили Telegram. Харидор мол меҷӯяд ва фармоиш медиҳад, фурӯшанда каталог ва статусро идора мекунад, админ дӯконҳоро тасдиқ мекунад ва оморро мебинад.

## Оғоз

```bash
npm install
npm install --prefix server
npm install --prefix client
npm run dev
```

- Барнома: http://localhost:5173
- API: http://localhost:4000

Дар браузер се нақши санҷишӣ ҳаст: харидор (Азиза), фурӯшанда (Дӯкони Заррина) ва админ.

Барои аз нав бор кардани маълумоти намунавӣ серверро боздоред, `npm run reseed`-ро иҷро кунед ва боз `npm run dev` кунед.

## Telegram

1. Аз BotFather бот созед ва токенро дар `.env` ба `BOT_TOKEN` гузоред.
2. `WEBAPP_URL`-ро ба суроғаи HTTPS (масалан туннели ngrok ба порти 5173) гузоред.
3. Агар админ аз рӯи Telegram ID бошад, ID-ро дар `ADMIN_TELEGRAM_IDS` нависед.
4. Серверро аз нав оғоз кунед. Бот `getUpdates`-ро гӯш мекунад, фармони `/start` тугмаи кушодани барнома медиҳад ва рақами телефонро аз тугмаи контакт мегирад.

Бе токен ҳам барнома кор мекунад: огоҳиномаҳо дар саҳифаи «Огоҳӣ» мемонанд. Бо токен ҳамон матн ба чати Telegram ҳам меравад.

## Пардохт ва Redis

Пардохти кортӣ ҳоло провайдери `mock` аст (`PAYMENT_PROVIDER`). Рақами корт нигоҳ дошта намешавад, танҳо 4 рақами охир. Барои провайдери маҳаллӣ `server/src/payments.js`-ро васл кунед.

Агар `REDIS_URL` бошад, огоҳиномаҳо ба рӯйхати `dukon:notifications` ҳам меафтанд. Бе Redis онҳо дар база мемонанд.

## Пойгоҳи додаҳо

Бе `DATABASE_URL` базаи файлӣ `server/data/db.json` истифода мешавад. Агар `DATABASE_URL` (Neon) бошад, ҳамон маълумот дар ҷадвали PostgreSQL `app_state` мемонад.

## Гузоштан: Vercel + Railway + Neon

1. Дар [Neon](https://neon.tech) лоиҳа созед ва пайванди `postgresql://...`-ро нусха кунед.
2. Дар [Railway](https://railway.com) ҳамин репозиторияро кушоед. Фармони оғоз: `npm start --prefix server`. Тағйирёбандаҳо:
   - `DATABASE_URL` — пайванди Neon
   - `JWT_SECRET` — сатри дароз ва тасодуфӣ
   - `BOT_TOKEN` — токени бот
   - `WEBAPP_URL` — суроғаи Vercel, масалан `https://dukon.vercel.app`
   - `CLIENT_ORIGIN` — ҳамон суроғаи Vercel
3. Дар [Vercel](https://vercel.com) решаро `client` гузоред. Ҳангоми сохтан:
   - `VITE_API_URL` — суроғаи Railway, бе хати моил дар охир, масалан `https://dukon-api.up.railway.app`
4. Пас аз оғоз `https://<railway>/api/health` бояд `{"ok":true,"store":"postgres"}` диҳад.
5. Дар BotFather тугмаи менюро ба суроғаи Vercel пайваст кунед.

Аксҳои боршудаи фурӯшанда дар диски Railway мемонанд ва ҳангоми навсозӣ тоза мешаванд. Аксҳои намунавӣ аз суроғаи берунӣ меоянд.

## Сохтор

- `client` — React, Vite, Tailwind, Telegram WebApp
- `server` — Express, огоҳинома, бот, боркунии акс
- Нақшҳо: харидор, фурӯшанда, админ
- Мавзӯъ аз `colorScheme`-и Telegram меояд; дар браузер тугмаи рӯшно/торик ҳаст
