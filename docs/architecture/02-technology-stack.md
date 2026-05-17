# 2. Technology stack

## 2.1 Core runtime

| Technology | Version (package.json) | Role |
|------------|------------------------|------|
| **React** | ^19.0.0 | UI rendering |
| **React DOM** | ^19.0.0 | DOM mount |
| **TypeScript** | ~5.6.2 | Static typing (`strict: true`) |
| **Vite** | ^6.0.5 | Dev server, HMR, production bundle |
| **React Router DOM** | ^7.1.1 | Client-side routing |

## 2.2 Styling

| Technology | Role |
|------------|------|
| **Tailwind CSS** v4 | Utility-first styling via `@tailwindcss/vite` plugin |
| **index.css** | Global tokens, base styles, Tailwind imports |

No separate CSS-in-JS library. Components use Tailwind class strings and occasional inline styles for charts/maps.

## 2.3 UI and icons

| Library | Usage |
|---------|--------|
| **lucide-react** | Sidebar icons, buttons, status indicators |
| Custom components | No third-party component library (no MUI/Chakra) |

## 2.4 Feature libraries

| Library | Domain |
|---------|--------|
| **socket.io-client** | Consultation signaling |
| **pdfjs-dist** | Patient report PDF text extraction for vitals |
| **react-markdown** | AI chat message rendering |
| **sentiment** | Optional chat sentiment scoring (`lib/ai/chatSentiment.ts`) |
| **leaflet** + **react-leaflet** | Hospital locator map tiles/markers |
| Browser **Web Speech API** | Live consult transcription (Chrome/Edge) |
| Browser **WebRTC** | Video/audio consult |

## 2.5 Build and quality

| Tool | Config file | Notes |
|------|-------------|-------|
| **Vite** | `vite.config.ts` | `@/` alias, dev proxy, port 3000 |
| **TypeScript project references** | `tsconfig.app.json`, `tsconfig.node.json` | `tsc -b` before production build |
| **ESLint** | `eslint.config.js` | React hooks + refresh plugins |

### npm scripts

```json
"dev": "vite",
"build": "tsc -b && vite build",
"lint": "eslint .",
"preview": "vite preview"
```

Production output: `dist/` (static assets; deploy to CDN or static host).

## 2.6 TypeScript configuration highlights

From `tsconfig.app.json`:

- **Target:** ES2022
- **Module:** ESNext, bundler resolution
- **JSX:** `react-jsx` (no React import required per file)
- **Strictness:** `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- **Path alias:** `@/*` → `src/*`

Ambient types: `src/vite-env.d.ts` (Vite `import.meta.env`), `src/types/speech-recognition.d.ts`, `src/types/sentiment.d.ts`.

## 2.7 Environment variables (browser-visible only)

All config uses the `VITE_` prefix (Vite exposes only these to the client bundle).

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_MEDIHUB_SERVER` | Yes | Backend origin (no trailing slash) |
| `VITE_MEDIHUB_SAME_ORIGIN` | No | Enable `/api` + `/socket.io` dev proxy |
| `VITE_*_PATH` | No | Override default REST paths (`config.ts`) |
| `VITE_OAUTH_REDIRECT_URL` | No | OAuth callback for social login |
| `VITE_HERO_VIDEO_URL` | No | Home page hero loop |
| `VITE_WEBRTC_ICE_SERVERS` | No | JSON array of `RTCIceServer` |

Full list: `.env.example`, `src/lib/config.ts`, [docs/production/environment-variables.md](../production/environment-variables.md).

**Never** put `GEMINI_API_KEY`, `GOOGLE_PLACES_API_KEY`, MongoDB URI, or JWT secrets in frontend env.

## 2.8 What is intentionally not used

- No Redux/Zustand global store (React state + outlet context).
- No React Query/SWR (manual `fetch` in effects and handlers).
- No Next.js SSR (pure CSR SPA).
- No test runner in `package.json` (tests not part of current scaffold).
