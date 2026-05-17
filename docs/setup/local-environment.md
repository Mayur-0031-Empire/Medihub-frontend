# Local environment setup

Environment files with **your** backend URL stay on your machine only. They are listed in [`.gitignore`](../../.gitignore) and are **not** committed.

For the full variable reference (optional paths, OAuth, WebRTC, hero video), see [../production/environment-variables.md](../production/environment-variables.md).

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| **Node.js** | 18+ recommended (Vite 6 + React 19) |
| **npm** | Comes with Node; use `npm install` at the repo root |
| **MediHub backend** | Running API reachable at the URL you put in `VITE_MEDIHUB_SERVER` |

---

## Quick start (new clone)

From the project root:

```bash
cp .env.example .env
cp .env.development.example .env.development
```

Edit **`.env`** and set your real backend:

```env
VITE_MEDIHUB_SERVER=https://your-backend-url.com
```

Optional — OAuth on localhost (dev server port **3000**):

```env
VITE_OAUTH_REDIRECT_URL=http://localhost:3000/auth/callback
```

Leave **`.env.development`** as copied (`VITE_MEDIHUB_SAME_ORIGIN=true`) unless you know you do not need the Vite proxy.

Then:

```bash
npm install
npm run dev
```

Open **http://localhost:3000** (port is set in `vite.config.ts`).

**Production-like check** (optional):

```bash
npm run build
npm run preview
```

Preview also serves on port **3000** by default. Env for preview uses production mode (`.env.production` if present), not `.env.development`.

---

## Which file does what

| File | In git? | Used when |
|------|---------|-----------|
| `.env.example` | Yes (template) | — |
| `.env.development.example` | Yes (template) | — |
| `.env.production.example` | Yes (template) | — |
| **`.env`** | **No** | `npm run dev`, `npm run build` (shared values) |
| **`.env.local`** | **No** | Overrides `.env` (personal) |
| **`.env.development`** | **No** | `npm run dev` only (proxy flag) |
| **`.env.development.local`** | **No** | Personal dev overrides |
| **`.env.production`** | **No** | `npm run build` / `npm run preview` |

Restart `npm run dev` after changing any `.env` file — Vite reads them at startup.

---

## Required local values

### `.env` (from `.env.example`)

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_MEDIHUB_SERVER` | **Yes** | `https://medihub-api.onrender.com` |

No trailing slash. This is always your **real API host** (not `http://localhost:3000`), even when the dev proxy is enabled.

### `.env.development` (from `.env.development.example`)

| Variable | Typical value | Purpose |
|----------|---------------|---------|
| `VITE_MEDIHUB_SAME_ORIGIN` | `true` | Same-origin `/api` + Vite proxy → fixes Strict cookies and Socket.IO locally |

**Not used in production** unless you run a same-origin API proxy on your live host. See [../production/environment-variables.md](../production/environment-variables.md).

---

## How local dev proxy works

When `VITE_MEDIHUB_SAME_ORIGIN=true` (in `.env.development`) **and** `VITE_MEDIHUB_SERVER` is set (in `.env`), Vite proxies:

| Browser path | Proxied to |
|--------------|------------|
| `/api/*` | `{VITE_MEDIHUB_SERVER}/api/*` |
| `/socket.io/*` | `{VITE_MEDIHUB_SERVER}/socket.io/*` (WebSocket) |

The app then calls `/api/...` on `localhost:3000`, so **HttpOnly cookies with `SameSite=Strict`** work during login. Socket.IO for video consult uses the same origin (`window.location.origin`), so consult signaling can use cookies without a separate Bearer setup.

OAuth redirects still go to the **real** `VITE_MEDIHUB_SERVER` (Google/Apple/Microsoft on the backend host). Register that callback URL on the backend, e.g. `http://localhost:3000/auth/callback`.

If you **disable** the proxy (`VITE_MEDIHUB_SAME_ORIGIN` unset/false), the browser calls the API host directly. You need correct CORS **and** the login/refresh response must include an **access token** in JSON for protected routes and Socket.IO.

---

## What to open locally

After `npm run dev`, useful URLs:

| URL | Purpose |
|-----|---------|
| `http://localhost:3000/` | Home — feature cards + care network charts |
| `http://localhost:3000/splash` | Intro splash (then redirects to `/`) |
| `http://localhost:3000/about` | About page |
| `http://localhost:3000/portals` | Patient / doctor / admin entry |
| `http://localhost:3000/features/*` | Feature marketing pages |
| `http://localhost:3000/login` | Sign in |
| `http://localhost:3000/register/patient` | Patient registration |
| `http://localhost:3000/register/doctor` | Doctor registration |
| `http://localhost:3000/dashboard/patient` | Patient dashboard (after login) |
| `http://localhost:3000/dashboard/doctor` | Doctor dashboard |
| `http://localhost:3000/dashboard/admin` | Admin dashboard |

**Settings** (theme light/dark/system, accessibility toggles) are stored in **browser `localStorage`** — no env vars. Use the gear icon in the public navbar or dashboard sidebar.

---

## What needs the backend

| Area | Needs `VITE_MEDIHUB_SERVER` | Notes |
|------|----------------------------|--------|
| Login / register / OAuth | Yes | Use proxy + `.env.development` for cookie auth |
| Dashboards (patient, doctor, admin) | Yes | Appointments, profile, slots, notifications |
| Home care network charts | Yes | Public doctors + optional public appointments API |
| Doctor / admin dashboard charts | Yes | Role-scoped appointment APIs |
| Hospital locator + map charts | Yes | Location permission + nearby hospitals API |
| BMI Buddy (dashboard) | Yes | `POST /api/bmi-buddy/calculate` |
| AI assistant (dashboard) | Yes | AI chat APIs |
| Video consult | Yes | Socket.IO + WebRTC; prefer same-origin proxy locally |
| Guest AI on home | Partial | May degrade without API |

Without `VITE_MEDIHUB_SERVER`, you will see “MediHub server URL is not configured” on API-backed screens. Static/marketing layout still renders.

**Historical home charts:** When public booking data is unavailable, the app may use **local snapshots** of doctor profile stats (saved in `localStorage` when you load the home page with a working API). Pick an older date in a chart filter to compare snapshots.

---

## Backend checklist (local)

Your MediHub API must:

1. Allow CORS from **`http://localhost:3000`** exactly (not `*` if using cookies on a **non-proxied** setup).
2. Send `Access-Control-Allow-Credentials: true` when using cross-origin `fetch` without the proxy.
3. Be reachable at the URL in `VITE_MEDIHUB_SERVER`.
4. Allow OAuth redirect **`http://localhost:3000/auth/callback`** if you test social login locally.
5. Expose **Socket.IO** on the same host as REST (proxied as `/socket.io` when using same-origin dev).

If login works in production but not on localhost:

1. Copy `.env.development.example` → `.env.development` with `VITE_MEDIHUB_SAME_ORIGIN=true`.
2. Confirm `VITE_MEDIHUB_SERVER` in `.env` points at the live API (not port 3000).
3. Restart `npm run dev`.

---

## Optional variables

See comments in [`.env.example`](../../.env.example) for:

- API path overrides (`VITE_AUTH_*`, `VITE_APPOINTMENTS_*`, …)
- OAuth provider paths and `VITE_OAUTH_REDIRECT_URL`
- `VITE_HERO_VIDEO_URL` — home hero loop (HTTPS)
- `VITE_WEBRTC_ICE_SERVERS` — JSON array of TURN/STUN servers for video consult

Full list: [../production/environment-variables.md](../production/environment-variables.md).

**Do not** put backend secrets in frontend env (Google Places, Gemini, Cloudinary, DB, JWT secrets). Those belong on the MediHub API only.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| “MediHub server URL is not configured” | Create `.env` from `.env.example` and set `VITE_MEDIHUB_SERVER` |
| Login succeeds but `/me` fails | Add `.env.development` with `VITE_MEDIHUB_SAME_ORIGIN=true`, restart dev server |
| CORS errors in browser | Use same-origin proxy, **or** match API `Access-Control-Allow-Origin` to `http://localhost:3000` |
| Video consult / Socket.IO fails | Keep `VITE_MEDIHUB_SAME_ORIGIN=true` so `/socket.io` is proxied; ensure backend Socket.IO is up |
| OAuth redirect mismatch | Set `VITE_OAUTH_REDIRECT_URL=http://localhost:3000/auth/callback` and allow it on the backend |
| Home charts empty | API must return public doctors; booking charts need public/admin appointment access per your backend |
| Hospital map empty | Allow browser location; confirm hospital-locator API and backend map config |
| Env changes ignored | Restart `npm run dev` (or rebuild for `npm run build`) |
| Dark mode / font size wrong | Use in-app **Settings**; not controlled by `.env` |

---

## Do not commit

Never commit `.env`, `.env.local`, `.env.development`, or `.env.production` — they may contain URLs or team-specific settings. Only commit the `*.example` templates.

**Further reading:** [docs/architecture/ARCHITECTURE.md](../architecture/ARCHITECTURE.md) · [docs/production/deployment-steps.md](../production/deployment-steps.md)
