# md_editor — UI (Next.js)

> ✍️ _This I made for the love of markdown._  
> (The editor is WYSIWYG until it isn’t. That’s called *character*.)

This is **not** a stock `create-next-app` demo anymore. It’s the **face** of [md_editor](../README.md): login, folders, articles, and a Milkdown-powered editor that’s smarter than your average `<textarea>`.

---

## 🚀 Dev server (when Docker feels like overkill)

```bash
npm install   # first time, unless you enjoy errors
npm run dev
```

Open **[http://localhost:3045](http://localhost:3045)** — because **3000** was too mainstream.

You’ll want the **API** running too (Docker or local FastAPI), or you’ll get very good at staring at auth errors. See **[../README.md](../README.md)** and **[../backend/README.md](../backend/README.md)**.

---

## 🎨 What’s in the tin (high level)

- 📝 **Milkdown + GFM** — Markdown editing that doesn’t hate tables *as much* as plain text does  
- 🔑 **Auth UI** — Register / login; tokens; the usual “who are you” theatre  
- 📂 **Folders & articles** — Organize, rename, move on; we’re not judging (much)  
- ⌨️ **Slash commands** — Type `/` and pretend you’re in Notion (you’re not; you’re cooler)  
- 🖨️ **Print / PDF-ish flows** — Where supported — browser print dialog, the UI’s favorite modal  

Stack highlights: **Next.js (App Router)**, **MobX**, **Tailwind**, **TypeScript** — so your bundle is *modern* and your types are *sometimes* honest.

---

## 🐳 Docker / production

Don’t deploy this folder alone like it’s 2015. Use **root `docker-compose`**: nginx, API, Postgres, **this** UI. Rebuild with the correct **`NEXT_PUBLIC_API_URL`** or enjoy CORS and broken fetches in production. (Spoiler: you won’t enjoy them.)

Details: **[../README.md](../README.md)** — especially the “rebuild UI with public API URL” bit. Yes, it’s annoying. Yes, it’s on purpose.

---

## 📚 Further reading

- 🏠 **[../README.md](../README.md)** — Docker, TLS, checklist, life advice  
- 🐍 **[../backend/README.md](../backend/README.md)** — API routes, JWT, “why is my token wrong”  

---

Built with **Next.js** and friends; their licenses apply. Any rough edges in the UI are *artisanal*.
