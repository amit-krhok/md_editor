# md_editor — Backend API

> ✍️ _This I made for the love of markdown._  
> (The JSON doesn’t love you back, but it’s *consistent*.)

FastAPI service for **[md_editor](../README.md)**: sign people up, lose their passwords *securely*, shove markdown into Postgres, pretend folders mean you’re organized.

---

## ✨ Features — what you actually get

| Area | What you get |
|------|----------------|
| 🔐 **Auth** | Register, OAuth2 password login (`/auth/token` — yes, `username` is your **email**; OAuth2 was designed by committee). JWTs so you can feel like a startup. |
| 👤 **Users** | `GET /users/me` — *who am I?* Change password — *who was I?* (Old password required; we’re not animals.) |
| 📁 **Folders** | CRUD per user. Finally, a place for “stuff” and “other stuff.” |
| 📄 **Articles** | Title + markdown body; optional folder; **move** when you file things wrong (always). |
| 🔎 **Queries** | Filter by `folder_id`, or `without_folder` for the beautiful chaos of “inbox.” |
| 🗄️ **Data** | Async SQLAlchemy + **Alembic** — migrations exist so you can’t pretend the schema never changed. |
| 🌐 **CORS** | Configurable; see `core/config.py` / `.env`. Browsers care *deeply* about this. You should too. |
| 🧯 **Errors** | JSON errors that mean things: 409, 422 weak password rant, 404, inactive user, etc. |
| ❤️ **Health** | `GET /test` — “Is the API up?” “Is Postgres alive?” Riveting cinema. |

---

## 🧱 Stack — buzzword-compliant

- **FastAPI** — Auto `/docs` so you can test APIs instead of writing them. (Kidding. Mostly.)
- **PostgreSQL** — Still cool after all these years.
- **JWT** — **`JWT_SECRET_KEY`** required at startup. Empty secret = app refuses to boot. We have *standards* (low, but standards).

---

## 🚀 Run it (without heroics)

**Normal humans:** repo root **Docker Compose** — see **[../README.md](../README.md)**. Spin up API + DB + UI + nginx; drink coffee; complain about Docker.

**Local cowboys:** copy `.env` from **`.env.example`** at repo root, install deps, run Uvicorn your way. Migrations live in **`alembic/`** — run them, or enjoy cryptic tracebacks. Your call.

---

## 📎 Routers — the map

- `/auth` — register, token (the only public love story here)
- `/users` — you, your password, your problems
- `/folders` — taxonomy cosplay
- `/articles` — the reason we’re all here

Everything except **register** + **token** wants a **Bearer** token. No token? No soup. 🔒
