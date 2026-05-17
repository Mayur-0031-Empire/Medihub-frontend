# Environment variables

MediHub frontend is a **Vite** app. Only variables prefixed with `VITE_` are exposed to the browser bundle. They are **embedded at build time** (`npm run build`), not read at runtime from the server.

---

## How Vite loads env files

| File | When it is loaded | Typical use |
|------|-------------------|-------------|
| `.env` | All modes (`dev`, `build`, `preview`) | Shared defaults (e.g. backend URL) |
| `.env.local` | All modes (gitignored) | Personal overrides, never commit |
| **`.env.development`** | **`vite dev` only** | Local dev-only flags (proxy) |
| `.env.development.local` | `vite dev` only (gitignored) | Personal dev overrides |
| `.env.production` | `vite build` / `vite preview` (production mode) | Production build values |
| `.env.production.local` | Production mode (gitignored) | CI secrets on build agent |

**Important:** `.env.development` is **not** used when you run `npm run build`. Production builds use `.env`, `.env.production`, and their `.local` variants.

---

## What `.env.development` is for

Your repo currently contains:

```env
# Loaded only for `vite dev` (not `vite build`). Proxies /api → VITE_MEDIHUB_SERVER so HttpOnly
# cookies with SameSite=Strict are stored for localhost and sent on /api requests.
VITE_MEDIHUB_SAME_ORIGIN=true
```

### Problem it solves

Many MediHub backends (e.g. on Render) set auth cookies with **`SameSite=Strict`**. The browser will **not** send those cookies on cross-origin requests from `http://localhost:3000` to `https://your-api.onrender.com`.

### What happens when `VITE_MEDIHUB_SAME_ORIGIN=true`

1. API `fetch` calls use **same-origin** paths like `/api/auth/login` (no full API host in the URL).
2. Vite’s dev server **proxies** `/api` and `/socket.io` to `VITE_MEDIHUB_SERVER` (see `vite.config.ts`).
3. The browser thinks the API is on `localhost`, so **Strict cookies work** during local development.
4. **OAuth** still uses the real `VITE_MEDIHUB_SERVER` URL (redirect to Google/Apple/Microsoft on the backend host).

### Production

**Do not set `VITE_MEDIHUB_SAME_ORIGIN=true` in production** unless you also put a reverse proxy in front of your static site so `/api` on the **same host** forwards to the MediHub backend. Typical production setup:

- Frontend: `https://app.example.com` (static files)
- API: `https://api.example.com`
- `VITE_MEDIHUB_SAME_ORIGIN` unset or `false`
- `VITE_MEDIHUB_SERVER=https://api.example.com`

---

## Required for every environment

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_MEDIHUB_SERVER` | **Yes** | Backend origin, **no trailing slash**, e.g. `https://api.example.com` |

Without this, login, registration, home-page tools, and the dashboard cannot call the API.

---

## Development-only (recommended)

| Variable | When | Description |
|----------|------|-------------|
| `VITE_MEDIHUB_SAME_ORIGIN` | `vite dev` only | Set to `true` in **`.env.development`** to enable the Vite proxy (see above). |

Also keep `VITE_MEDIHUB_SERVER` in `.env` (or `.env.local`) pointing at your real backend URL even when using the proxy.

---

## Optional (dev and production)

Set only if your deployed API paths differ from the defaults in `src/lib/config.ts` and [README.md](../../README.md).

| Variable | Default (if unset) |
|----------|-------------------|
| `VITE_AUTH_REGISTER_PATH` | `/api/auth/register` |
| `VITE_AUTH_LOGIN_PATH` | `/api/auth/login` |
| `VITE_AUTH_LOGOUT_PATH` | `/api/auth/logout` |
| `VITE_AUTH_REFRESH_PATH` | `/api/auth/refresh` |
| `VITE_USER_ME_PATH` | `/api/users/me` |
| `VITE_USER_ME_PHOTO_PATH` | `/api/users/me/photo` |
| `VITE_USER_ME_PASSWORD_PATH` | `/api/users/me/password` |
| `VITE_DOCTOR_ME_PATH` | `/api/doctors/me` |
| `VITE_DOCTOR_ME_DOCUMENTS_PATH` | `/api/doctors/me/documents` |
| `VITE_AUTH_GOOGLE_PATH` | `/api/auth/google` |
| `VITE_AUTH_APPLE_PATH` | `/api/auth/apple` |
| `VITE_AUTH_MICROSOFT_PATH` | `/api/auth/microsoft` |
| `VITE_BMI_BUDDY_PATH` | `/api/bmi-buddy` |
| `VITE_BMI_BUDDY_CALCULATE_PATH` | `/api/bmi-buddy/calculate` |
| `VITE_AI_CHATS_PATH` | `/api/ai/chats` |
| `VITE_HOSPITAL_LOCATOR_NEARBY_PATH` | `/api/hospital-locator/nearby` |
| `VITE_DOCTORS_PUBLIC_PATH` | `/api/doctors` |
| `VITE_APPOINTMENTS_*` | See `src/lib/config.ts` |

### OAuth

| Variable | Description |
|----------|-------------|
| `VITE_OAUTH_REDIRECT_URL` | Where the backend should redirect after social login, e.g. `https://app.example.com/auth/callback`. Must match the backend allowlist. |

### UI / WebRTC

| Variable | Description |
|----------|-------------|
| `VITE_HERO_VIDEO_URL` | HTTPS URL for the home page hero loop video |
| `VITE_WEBRTC_ICE_SERVERS` | JSON array of `RTCIceServer` objects for video consult (optional TURN) |

---

## What must **not** go in frontend env

These belong on the **MediHub backend** only, never in Vite env:

- `GOOGLE_PLACES_API_KEY`, `GEMINI_API_KEY`
- `CLOUDINARY_*`, MongoDB URI, JWT signing secrets

See [README — Sensitive Data Rules](../../README.md#sensitive-data-rules).

---

## Example layouts

### Local development

**`.env`** (or `.env.local`):

```env
VITE_MEDIHUB_SERVER=https://your-backend.example.com
# VITE_OAUTH_REDIRECT_URL=http://localhost:3000/auth/callback
```

**`.env.development`**:

```env
VITE_MEDIHUB_SAME_ORIGIN=true
```

Run: `npm run dev` (dev server port **3000** per `vite.config.ts`).

### Production build (CI or deploy machine)

**`.env.production`** or CI environment variables before `npm run build`:

```env
VITE_MEDIHUB_SERVER=https://api.example.com
VITE_OAUTH_REDIRECT_URL=https://app.example.com/auth/callback
# VITE_HERO_VIDEO_URL=https://cdn.example.com/hero.mp4
```

Do **not** set `VITE_MEDIHUB_SAME_ORIGIN=true` unless you run a same-origin API proxy in production.

---

## Quick reference: `.env.development` vs production

| | `.env.development` | Production |
|--|-------------------|------------|
| Used by | `npm run dev` only | `npm run build` |
| `VITE_MEDIHUB_SAME_ORIGIN` | Usually `true` (proxy) | Usually **unset** |
| `VITE_MEDIHUB_SERVER` | Real API URL (for proxy target + OAuth) | Public API URL baked into bundle |
| API requests from browser | `/api/...` on localhost | `https://api.example.com/api/...` |
| Cookies | Work with Strict via proxy | Need correct CORS + cookie `Domain`/`SameSite` from backend |
