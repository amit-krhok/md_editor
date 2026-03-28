# md_editor

A docker based self-hosted simple markdown editor for personal use.

## Tech Stack

- FastAPI
- React+Next
- PostgreSQL

## Docker Compose

- **Networks** — **`md_editor_backend`** (`internal: true`): `db`, `api`, `ui` only. **`md_editor_frontend`**: **`nginx` only** (plus its attachment to the backend net so it can proxy). Nothing else sits on the frontend network, so the split is “edge vs app/data plane”.
- **nginx** — `http://localhost` (and `:443` when you add TLS) proxies `/` → Next.js (`ui:3000`) and `/api/` → FastAPI (`api:8000`).
- **ui** — also on `http://localhost:3000` for direct access.
- **api** — `http://localhost:8005` for direct API calls.

To harden further, drop the **`8005`** / **`3000`** port mappings so only nginx is reachable from the host.

HTTPS: copy `nginx/conf.d/zz-https.local.conf.example` to `nginx/conf.d/zz-https.local.conf` (gitignored), put certs in `./certs/`, then `docker compose up -d --build`. Tune `server_name` and paths only in that local file.
