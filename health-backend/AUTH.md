# Health auth — setup & rotation

## One-time setup (Apps Script editor)
1. `cd health-backend && npx clasp push --force`  (pushes auth.gs + Code.gs)
2. Reload the editor tab. Set the passwords — run each once in the editor:
   - `setUser("ayush", "<ayush-password>")`
   - `setUser("saanu", "<saanu-password>")`
   (View → Execution log shows "Password set for …".)
3. **Rotate the API token** (the old one is public in git history):
   Project Settings → Script Properties → set `API_TOKEN` to a fresh value
   (`openssl rand -hex 16`). No client change needed — login now issues it.
4. Deploy → Manage deployments → Edit → **New version** → Deploy.

## Verify (curl)
```bash
curl -sL -X POST "<EXEC_URL>" -H "Content-Type: text/plain" \
  --data '{"action":"login","username":"ayush","password":"<pw>"}'   # {"ok":true,"token":...}
curl -sL -X POST "<EXEC_URL>" -H "Content-Type: text/plain" \
  --data '{"action":"login","username":"ayush","password":"nope"}'   # {"ok":false,"error":"invalid"}
curl -sL "<EXEC_URL>?token=<OLD_TOKEN>"    # {"error":"unauthorized"} after rotation
```

## Change a password
Re-run `setUser("<username>", "<new-password>")` in the editor. No redeploy needed.

## Rotate the token (e.g., lost device)
Set a new `API_TOKEN` Script Property. Everyone re-logs in (their stored session
token becomes unauthorized → app returns them to the login screen).
