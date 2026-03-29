# md_editor

A docker based self-hosted simple markdown editor for personal use.

## Tech Stack

- FastAPI
- React+Next
- PostgreSQL

## Docker Compose

- **Networks** — **`md_editor_backend`** (`internal: true`): `db`, `api`, `ui` only. **`md_editor_frontend`**: **`nginx` only** (plus its attachment to the backend net so it can proxy). Nothing else sits on the frontend network, so the split is “edge vs app/data plane”.
- **nginx** — `http://localhost` (and `:443` when you add TLS) proxies `/` → Next.js (`ui:3045`) and `/api/` → FastAPI (`api:8000`).
- **ui** — also on `http://localhost:3045` for direct access.
- **api** — `http://localhost:8005` for direct API calls.

To harden further, drop the **`8005`** / **`3045`** port mappings so only nginx is reachable from the host.

HTTPS: copy `nginx/conf.d/zz-https.local.conf.example` to `nginx/conf.d/zz-https.local.conf` (gitignored), put certs in `./certs/`, then `docker compose up -d --build`. Tune `server_name` and paths only in that local file.

## Production checklist

1. **Secrets on the server** — Create a real `.env` (never commit). Set a long random **`JWT_SECRET_KEY`**, strong **`POSTGRES_PASSWORD`**, and unique DB user if you like. Remove or replace any dev defaults from `.env.example`.

2. **CORS** — Set **`CORS_ORIGINS`** to your public site origin(s), e.g. `https://editor.example.com` (comma-separated if several). The API must allow the exact origin the browser uses for the UI.

3. **HTTPS** — Obtain TLS certs (e.g. Let’s Encrypt). Place **`fullchain.pem`** and **`privatekey.pem`** under **`certs/`** (or set **`MD_EDITOR_CERT_DIR`**). Copy **`nginx/conf.d/zz-https.local.conf.example`** → **`zz-https.local.conf`**, set **`server_name`** to your domain, enable OCSP stapling only if you use a public CA and add a **`resolver`** (see comments in the example).

4. **Rebuild the UI with the public API URL** — `NEXT_PUBLIC_*` is baked in at **build** time. After HTTPS and domain are fixed, build with the URL browsers will use, e.g.  
   `NEXT_PUBLIC_API_URL=https://editor.example.com/api docker compose build ui --no-cache`  
   then **`docker compose up -d`**.

5. **Shrink the attack surface** — In **`docker-compose.yml`**, remove host mappings **`8005:8000`** and **`3045:3045`** so only **nginx** (`80`/`443`) is reachable from outside.

6. **Access control** — Set **`SUPERUSER_EMAILS`** (or your app’s equivalent) so trusted accounts are activated; review registration/login behavior for a public deployment.

7. **Data and logs** — The Postgres volume **`postgres_data_md_editor`** holds all DB data: include it in backups. **`./logs`** is mounted into the API container for app logs.

8. **Host firewall** — Allow inbound **`80`/`443`** (and **`22`** or your admin path) only; block direct exposure of Postgres and optional debug ports.

9. **Updates** — Rebuild images after code changes (`docker compose build` / `up -d`); run DB migrations if your backend adds them.

This project uses open-source libraries including Milkdown, CodeMirror, and others.
All respective licenses apply to their components.
