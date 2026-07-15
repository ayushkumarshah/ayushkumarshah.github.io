# Deploying the Health backend (Apps Script via clasp)

## One-time setup
1. `cd health-backend && npm install`
2. `npx clasp login` (opens a browser; authorize the Google account that OWNS
   the diet/fitness Sheet).
3. Enable the Apps Script API once at https://script.google.com/home/usersettings
4. Create a container-bound script tied to the Sheet:
   `npx clasp create --type sheets --title "Health Backend" --rootDir src`
   (or `npx clasp clone <scriptId>` if the Sheet already has a bound script).
   This writes `.clasp.json` (git-ignored).
5. In `src/Code.js`, set `SCHEDULE_TAB` to the exact name of the schedule tab.

## Push + configure
6. `npx clasp push` — uploads `src/*.js` (as `.gs`) and `appsscript.json`.
7. Set the API token: open the script (`npx clasp open`), then
   Project Settings → Script Properties → add `API_TOKEN` = a long random string.
   Keep this value; the front-end and calendar URLs need it.

## Deploy the web app
8. `npx clasp deploy --description "v1"` → note the deployment's web-app URL
   (`https://script.google.com/macros/s/<id>/exec`).
   (Or Deploy → New deployment → Web app: execute as **me**, access **Anyone**.)

## Verify (curl — CORS is a browser concern, verified in the front-end plan)
9. Schedule JSON:
   `curl -sL "<EXEC_URL>?token=<API_TOKEN>" | head -c 400`
   Expect JSON starting with `{"schedule":{"office":{"ayush":[`.
10. Unauthorized is rejected:
    `curl -sL "<EXEC_URL>?token=wrong"` → `{"error":"unauthorized"}`.
11. Calendar feed:
    `curl -sL "<EXEC_URL>?token=<API_TOKEN>&format=ics&person=ayush" | head`
    Expect `BEGIN:VCALENDAR` … with `BEGIN:VEVENT` / `RRULE` / `BEGIN:VALARM`.
12. Check-off write:
    `curl -sL -X POST "<EXEC_URL>" -H "Content-Type: text/plain" \
      --data '{"token":"<API_TOKEN>","date":"2026-07-11","person":"ayush","itemId":"office:ayush:07:00:gym-strength-together","itemLabel":"Gym","done":true}'`
    Expect `{"ok":true}`; confirm a new row in the hidden **Log** tab.
13. Log read:
    `curl -sL "<EXEC_URL>?token=<API_TOKEN>&action=log&date=2026-07-11"`
    Expect `{"rows":[{...itemId...}]}`.

## Reminders (one-time, each phone)
14. On each iPhone: Settings → Calendar → Accounts → Add Account → Other →
    Add Subscribed Calendar → URL:
    `<EXEC_URL>?token=<API_TOKEN>&format=ics&person=ayush` (or `simran`).
