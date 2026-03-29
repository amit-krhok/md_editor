# md_editor

A **Docker-first**, **self-hosted**, **actually yours** markdown workspace. Not SaaS. Not “AI-powered synergy.” Just files, folders, and the sweet sound of `|` pipes in tables.

---

## ✨ Product features (the part humans care about)

- ⌨️ **Slash commands** — Type `/` for tables (with row/column counts), images, links, and **in-table** shortcuts (rows/columns add/remove) when your cursor’s in a cell—no floating toolbar blocking the text.
- 📝 **Real markdown, edited for real** — **[Milkdown](https://milkdown.dev/)** + **GFM**: headings, lists, block quotes, rules, **strikethrough**, **task lists** (`- [ ]` / `- [x]`), **tables** with normal keyboard nav.
- 📖 **Definition lists** — `term` / `: definition` style blocks for the glossary-inclined.
- 😀 **Emoji** — `:shortcode:` input rules plus a picker-style autocomplete when you’re feeling expressive.
- 💻 **Code blocks** — Language hinting via **CodeMirror** and a copy button so you’re not selecting text like it’s 2003.
- 📁 **Library model** — Folders and articles, move pieces around, JWT auth, “this is mine” data in **Postgres**.
- 🖨️ **Print friendly** — Pipe an article through the browser print dialog (PDF vibes) when you need something attachable.

---

## 🧰 Tech stack (the greatest hits)

- ⚡ **FastAPI** — Python goes brrr, OpenAPI docs for people who read docs
- ⚛️ **React + Next.js** — Yes, another Next app. It’s fine. You’ll survive.
- 🐘 **PostgreSQL** — Because your notes deserve a real database, not `localStorage` roulette

---

## 🐳 Docker Compose — who talks to whom

- 🕸️ **Networks** — **`md_editor_backend`** (`internal: true`): `db`, `api`, `ui` huddle together like introverts at a party. **`md_editor_frontend`**: **`nginx` only** (plus a polite tether to the backend net for proxying). Translation: **edge** vs **“please don’t expose Postgres to the internet”** plane.
- 🚪 **nginx** — `http://localhost` (and `:443` when you stop procrastinating on TLS) sends `/` → Next (`ui:3045`) and `/api/` → FastAPI (`api:8000`).
- 🖥️ **ui** — [http://localhost:3045](http://localhost:3045) if you _must_ skip nginx. (You don’t _have_ to. But you _can_.)
- 🔌 **api** — `http://localhost:8005` for curl warriors and “just one quick request.”

🔒 **Hardening (recommended):** rip out the **`8005`** / **`3045`** host mappings so strangers stop at **nginx** and don’t tour your stack.

🔐 **HTTPS (when you’re ready):** copy `nginx/conf.d/zz-https.local.conf.example` → `nginx/conf.d/zz-https.local.conf` (gitignored), drop certs in `./certs/`, `docker compose up -d --build`. Edit `server_name` and paths **only** in that local file—because committing your infra dreams is a different hobby.

---

## 🖥️ Electron desktop (optional)

The **`electron/`** shell can run the UI against Docker Compose on your machine (see scripts and `docker-compose.electron.yml`). **`npm run build`** produces a packaged app (e.g. macOS DMG) via **electron-builder**.

**Security (read this):** the build copies **`electron/.env`** into the app bundle as **`extraResources`** so the packaged binary can use the same database/API settings as local dev. That **bakes secrets into the distributable**. Treat it as **personal / private use** on hardware you control. **Do not** ship that DMG to others or publish it if it contains real credentials—the binary is not a safe place for secrets. For anything you’d hand to another person, use a different packaging story (no baked `.env`, or runtime config they supply themselves).

---

## 🎓 Production checklist (read this or enjoy regret)

1. 🔑 **Secrets** — Real `.env` on the server. **`JWT_SECRET_KEY`**: long, random, not `changeme`. **`POSTGRES_PASSWORD`**: same energy. Never commit. `.env.example` is a _hint_, not a dare.

2. 🌍 **CORS** — Set **`CORS_ORIGINS`** to the _exact_ origin the browser uses. Typos here = hours of “it works on my machine” (it doesn’t).

3. 🔒 **HTTPS** — Certs (Let’s Encrypt, your CA of choice, etc.). **`fullchain.pem`** + **`privatekey.pem`** in **`certs/`** (or **`MD_EDITOR_CERT_DIR`**). Copy the nginx HTTPS example → local conf, set **`server_name`**. OCSP stapling: only if you know what that means; comments in the example are your friend.

4. 🏗️ **Rebuild UI with the real API URL** — `NEXT_PUBLIC_*` is **baked at build time**, not runtime. Surprise! Rebuild after you fix the domain, e.g.  
   `NEXT_PUBLIC_API_URL=https://editor.example.com/api docker compose build ui --no-cache`  
   then `docker compose up -d`.

5. 🎯 **Shrink the surface** — Remove **`8005:8000`** and **`3045:3045`** from **`docker-compose.yml`** so the world only knocks on **80/443**. Revolutionary.

6. 👮 **Access control** — **`SUPERUSER_EMAILS`** (or equivalent): who gets to exist when registration is a thing. Review login/register before you paste the URL in a group chat.

7. 💾 **Data & logs** — Volume **`postgres_data_md_editor`** = your life story. Back it up. **`./logs`** in the API container = breadcrumbs when something whines.

8. 🧱 **Firewall** — **80/443** (and **22** if you SSH like a civilized person). Not: Postgres on the public timeline.

9. 🔄 **Updates** — Rebuild images when code moves. Run **Alembic** migrations when the backend says so. Ignoring migrations is a personality, not a strategy.

---

## 📚 More reading

- 🐍 **[backend/README.md](backend/README.md)** — API features, routes, and JWT drama
- 🖼️ **[ui/README.md](ui/README.md)** — Next dev server, Milkdown, and “why is my port 3045”
- 🧩 **`electron/`** — Optional desktop shell (same baked-`.env` / packaging caveats as **Electron desktop** above)

---

Built with open-source goodies (Milkdown, CodeMirror, and friends). Their licenses apply; blame them for the good parts.
