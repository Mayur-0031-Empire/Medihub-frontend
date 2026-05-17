# Production deployment steps

Step-by-step checklist for deploying the MediHub **frontend** (Vite + React static build). Assumes the MediHub **backend** is deployed separately.

---

## 1. Prerequisites

- [ ] MediHub backend is live at a stable HTTPS URL (e.g. `https://api.example.com`)
- [ ] Node.js 18+ on the build machine (or CI)
- [ ] Hosting for static files (Vercel, Netlify, S3 + CloudFront, Nginx, etc.)

---

## 2. Configure production environment (before build)

Vite bakes `VITE_*` values into `dist/` at **build time**. Set them **before** `npm run build`.

### Minimum required

Copy the template and edit (file is gitignored):

```bash
cp .env.production.example .env.production
```

Or set the same keys in your CI/CD secrets before `npm run build`:

Create **`.env.production`** in the project root:

```env
VITE_MEDIHUB_SERVER=https://api.example.com
```

Rules:

- Use **HTTPS** in production
- **No trailing slash** on the URL
- Replace `api.example.com` with your real API host

### Recommended

```env
VITE_OAUTH_REDIRECT_URL=https://app.example.com/auth/callback
```

Must match a URL your **backend** allows for OAuth callbacks.

### Do not use in production (unless you proxy `/api`)

```env
# VITE_MEDIHUB_SAME_ORIGIN=true   ← dev only; see environment-variables.md
```

---

## 3. Build the app

```bash
npm ci
npm run build
```

Output: `dist/` (static HTML, JS, CSS).

Verify locally (optional):

```bash
npm run preview
```

Open the URL shown (production mode preview). Confirm the app loads and `VITE_MEDIHUB_SERVER` points at your API (check Network tab: requests go to `https://api.example.com/...`).

---

## 4. Deploy `dist/`

Upload or publish the **`dist`** folder to your host.

| Host type | Notes |
|-----------|--------|
| Vercel / Netlify | Set build command `npm run build`, publish directory `dist`, env vars in dashboard **before** build |
| S3 + CloudFront | Upload `dist` contents; set `index.html` error routing to SPA fallback if needed |
| Nginx | `root` → `dist`; `try_files $uri $uri/ /index.html;` for client-side routes |

### SPA routing

React Router paths (`/login`, `/register/patient`, `/dashboard/...`) must fall back to `index.html` on refresh.

---

## 5. Backend CORS (required)

The API must allow your **production frontend origin** exactly:

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
```

- Cannot be `*` when using cookies or `credentials: "include"`
- Must include the scheme (`https`) and host; port only if you use a non-default port

Allow methods/headers your app uses: `GET`, `POST`, `PATCH`, `DELETE`, `Content-Type`, `Authorization`.

---

## 6. Backend cookies & auth

If the backend uses **HttpOnly cookies**:

- `Secure` should be **true** in production (HTTPS only)
- `SameSite` is usually `Lax` or `None` (+ `Secure`) for cross-subdomain setups (`app.example.com` ↔ `api.example.com`)
- Cookie `Domain` may need to be set if sharing across subdomains (backend team decision)

The frontend also supports **Bearer tokens** in `sessionStorage` when the login/register JSON returns a token.

---

## 7. OAuth (if using Google / Apple / Microsoft)

On the **backend**:

- [ ] Allow redirect URI: `https://app.example.com/auth/callback` (or your `VITE_OAUTH_REDIRECT_URL`)
- [ ] OAuth start URLs resolve on `VITE_MEDIHUB_SERVER`

On the **frontend** build:

- [ ] `VITE_OAUTH_REDIRECT_URL=https://app.example.com/auth/callback`

---

## 8. Optional: same-origin API proxy (advanced)

Only if you want the browser to call `/api` on the **same host** as the SPA (similar to local dev):

1. Configure nginx/CloudFront to proxy `/api` and `/socket.io` → `https://api.example.com`
2. Set at build time: `VITE_MEDIHUB_SAME_ORIGIN=true` and still set `VITE_MEDIHUB_SERVER` to the real API (for OAuth)

Most teams skip this and use a separate API subdomain with proper CORS instead.

---

## 9. Post-deploy smoke test

- [ ] Home page loads; **Try MediHub tools** (chat, BMI, hospital search) if API is public
- [ ] Register (patient / doctor / admin) completes
- [ ] Login → dashboard redirect works
- [ ] Protected `GET /api/users/me` succeeds (cookie or Bearer)
- [ ] Doctor: appointments, slots, consult (Socket.IO + WebRTC if used)
- [ ] OAuth login (if enabled)

---

## 10. Environment file hygiene

| File | Commit to git? |
|------|----------------|
| `.env.example` | Yes (template) |
| `.env.development.example` | Yes (template) |
| `.env.production.example` | Yes (template) |
| `docs/setup/*`, `docs/production/*` | Yes |
| `.env`, `.env.local`, `.env.development`, `.env.production` | **No** — use templates in [docs/setup/local-environment.md](../setup/local-environment.md) |

See [`.gitignore`](../../.gitignore).

---

## Summary

| Stage | What you need |
|-------|----------------|
| **Local dev** | `.env` + `VITE_MEDIHUB_SERVER`; `.env.development` with `VITE_MEDIHUB_SAME_ORIGIN=true` |
| **Production build** | `VITE_MEDIHUB_SERVER` (+ optional `VITE_OAUTH_REDIRECT_URL`, path overrides) |
| **Production runtime** | Static `dist/` + backend CORS + cookies/OAuth configured for your frontend URL |

For variable details, see [environment-variables.md](./environment-variables.md).
