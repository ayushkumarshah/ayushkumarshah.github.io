# Birthday backend deployment

This uses the same Apps Script authentication model as `/health`, in a separate
project and with separate Script Properties.

## Create and push

```bash
cd birthday-backend
npm install
npx clasp login
npx clasp create --type standalone --title "Private Birthday Backend" --rootDir src
npx clasp push
npx clasp open-script
```

In Apps Script, open **Project Settings → Script Properties** and create:

- `API_TOKEN`: generate a private random value, for example with
  `openssl rand -hex 32`
- `PASSWORD_SETUP`: the birthday-site password you choose

Do not put either the token or password in this repository.

## Set the password

Open the Apps Script editor, select `installBirthdayPassword` in the function
menu, and run it once. It hashes the `PASSWORD_SETUP` value into `USER_saanu` and
then deletes `PASSWORD_SETUP` automatically.

```javascript
installBirthdayPassword()
```

Return to Script Properties and verify that `USER_saanu` exists and
`PASSWORD_SETUP` is gone. The chosen password must not be committed to
`config.js` or any frontend file.

## Deploy

Deploy → New deployment → Web app:

- Execute as: **Me**
- Who has access: **Anyone**

Copy the resulting `/exec` URL into `bday2026/config.js` as `EXEC_URL`.

The frontend posts login requests as plain text JSON, matching `/health`, so it
does not trigger a CORS preflight. After changing the backend, create a new Apps
Script deployment version.

## Verify

```bash
curl -sL "<EXEC_URL>" -H "Content-Type: text/plain" \
  --data '{"action":"login","username":"saanu","password":"<password>"}'
```

Expect JSON containing `{"ok":true,"token":"…"}`. Do not use `-X POST`; the
Apps Script redirect behavior is the same as documented for the health backend.
