# md_editor

A **Docker-first**, **self-hosted**, **actually yours** markdown workspace. Not SaaS. Not “AI-powered synergy.” Just files, folders, and the sweet sound of `|` pipes in tables.

---

## Why this exists

- You wanted a private markdown workspace.
- You did not want another cloud dashboard with 19 pricing tiers.
- You wanted folders, files, auth, and an editor that behaves like markdown, not a haunted PowerPoint.

Mission accomplished (mostly).

---

## ✨ Product features (human edition)

- ⌨️ **Slash commands** — Type `/` for tables (with row/column counts), images, links, and in-table shortcuts (add/remove rows/columns) when your cursor is in a table cell.
- 📝 **Actual markdown editing** — **[Milkdown](https://milkdown.dev/)** + **GFM** (headings, lists, block quotes, strikethrough, task lists, tables, etc.).
- 📖 **Definition lists** — `term` then `: definition` if you enjoy civilized structure.
- 😀 **Emoji support** — `:shortcode:` rules and picker-like autocomplete for emotional range.
- 💻 **Code blocks** — CodeMirror language hinting + copy button so you can pretend this was always clean.
- 📁 **Library model** — Folders + files with JWT auth and PostgreSQL persistence.
- 🖨️ **Print to PDF flow** — Browser print path for "please attach this in a ticket" moments.

---

## 🧰 Tech stack

- ⚡ **FastAPI**
- ⚛️ **React + Next.js**
- 🐘 **PostgreSQL**
- 🐳 **Docker Compose**
- 🖥️ **Electron** (optional desktop shell)

---

## 🐳 Docker Compose quick map

- 🚪 **nginx** serves `http://localhost` and proxies:
  - `/` -> `ui:3045`
  - `/api/` -> `api:8000`
- 🖥️ **ui** direct: [http://localhost:3045](http://localhost:3045) (if you insist)
- 🔌 **api** direct: `http://localhost:8005` (for curl warriors)
- 🕸️ Services are split across backend/frontend networks to reduce accidental internet chaos.

### If `docker compose` is not working

Beautiful. You're now part of the team.

1. Run `docker compose logs -f` and read the error (yes, all of it).
2. Fix what is broken.
3. If your fix is useful, open a PR so everyone suffers less.

---

## 🖥️ Electron desktop (optional)

The **`electron/`** shell can run the UI against Docker Compose on your machine (see scripts and `docker-compose.electron.yml`). **`npm run build`** produces a packaged app (e.g. macOS DMG) via **electron-builder**.

**Security (read this):** the build copies **`electron/.env`** into the app bundle as **`extraResources`** so the packaged binary can use the same database/API settings as local dev. That **bakes secrets into the distributable**. Treat it as **personal / private use** on hardware you control. **Do not** ship that DMG to others or publish it if it contains real credentials—the binary is not a safe place for secrets. For anything you’d hand to another person, use a different packaging story (no baked `.env`, or runtime config they supply themselves).

---

## 🤝 Contributions (feature requests disguised as effort)

- Didn't like a feature? **Raise a PR.**
- Found a bug? **Raise a PR.**
- Think a section is dumb? **Raise a PR with better dumbness.**

Issue reports are welcome too, but code that fixes things gets merged faster than feelings.

---

## 🎓 Production checklist (read this or enjoy regret)

1. 🔑 **Secrets** — Real `.env` on the server. `JWT_SECRET_KEY` and `POSTGRES_PASSWORD` must be strong and not comedic.
2. 🌍 **CORS** — Set `CORS_ORIGINS` to the exact browser origin.
3. 🔒 **HTTPS** — Configure certs and nginx HTTPS local override.
4. 🏗️ **Rebuild UI with real API URL** — `NEXT_PUBLIC_*` is build-time baked.
5. 🎯 **Reduce attack surface** — Remove direct `8005` and `3045` mappings for public deployments.
6. 👮 **Access control** — Configure superuser/admin gatekeeping.
7. 💾 **Backups** — Protect `postgres_data_md_editor` like it contains your career (it might).
8. 🧱 **Firewall** — Open 80/443 (+22 if needed), not the whole buffet.
9. 🔄 **Updates** — Rebuild, migrate, and stop pretending Alembic is optional.

---

## 📚 More reading

- 🐍 **[backend/README.md](backend/README.md)** — API routes, auth, and backend setup
- 🖼️ **[ui/README.md](ui/README.md)** — UI dev setup and editor details
- 🧩 **`electron/`** — Desktop shell caveats and packaging

---

Built with open-source goodness (Milkdown, CodeMirror, and friends). Their licenses apply. We take credit only for the questionable jokes.
