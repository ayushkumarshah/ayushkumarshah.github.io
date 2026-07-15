# Health companion — front-end (/health)

A build-free PWA served at `shahayush.com/health/`. Reads the Apps Script backend
(see `../health-backend/DEPLOY.md`).

## Configure
Edit `config.js` and set:
- `EXEC_URL` — the Apps Script web-app `…/exec` URL

`config.js` is committed so GitHub Pages can serve it — it holds no secrets. Access
is gated by a login screen; the backend issues a per-session token after a
username/password check, and the app stores it in `localStorage` (see `js/api.js`).

## Run locally
```bash
cd health && python3 -m http.server 8080
# open http://localhost:8080/
```

## Verify end-to-end
1. Home shows today's day-type, a Now/Next card, and a checkable timeline.
2. Person switch (You / Simran / Both) works; Both shows side-by-side.
3. Food → Today shows meals + protein bar; Meal prep shows batch-cook ×3 + grocery list.
4. Gym shows today's workout + the weekly split; Rules shows two calendar links + principles.
5. Tap a check → persists across reload (written to the Sheet Log tab).
6. Offline (after one online load): shell + last schedule render with the "saved copy" banner.
7. Install: iPhone Safari → Share → Add to Home Screen → opens standalone.

## Deploy
Commit under `health/`; it ships with the normal GitHub Pages build. `health-frontend/`
(tests) is excluded from the Jekyll build. After pushing, load
`https://shahayush.com/health/` and re-run the verify steps on both phones.

## Tests (pure logic)
```bash
cd health-frontend && npm test
```
