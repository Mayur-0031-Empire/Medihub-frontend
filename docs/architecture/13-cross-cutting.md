# 13. Cross-cutting concerns

## 13.1 Error handling and user messages

Central module: `src/lib/userMessages.ts`.

| Export | Purpose |
|--------|---------|
| `NETWORK_ERROR` | Generic offline/CORS message |
| `SERVICE_UNAVAILABLE` | Missing `VITE_MEDIHUB_SERVER` |
| `userFacingError(e, fallback)` | Map `Error` to display string |
| `sanitizeUserFacingMessage(msg, fallback)` | Strip internal details |

`DashboardLayout` treats connection/config errors differently from auth failures (no login redirect for misconfigured `.env`).

## 13.2 Security

### Secrets

- **Never** bundle API keys for Google, Gemini, Cloudinary, MongoDB, JWT signing.
- Only `VITE_*` public config in client.

### Auth

- Prefer HttpOnly refresh cookies + short-lived access token.
- `sessionStorage` access token cleared on logout.
- `safeDashboardReturnTo` prevents open redirects after login.

### File uploads

- Medical files sent to backend only; URLs returned for display.
- PDF parsing runs locally — file content not sent to third parties except your API when uploading.

### XSS

- `react-markdown` for AI replies — ensure backend sanitizes HTML if raw HTML ever enabled.
- Avoid `dangerouslySetInnerHTML` except where audited.

### CORS (operations)

Backend must allow frontend origin with `Access-Control-Allow-Credentials: true` when using cookies.

## 13.3 Performance considerations

| Area | Current approach | Note |
|------|------------------|------|
| List refetch | Full refetch after mutations | Simple; may scale poorly |
| Medical library | N+1 detail fetches | Documented API gap |
| Consult poll | 8s interval | Tunable via hook arg |
| Code splitting | Vite default route chunks | No manual `React.lazy` in App.tsx yet |
| PDF vitals | pdf.js worker bundled | Large chunk; loaded on demand in flow |

## 13.4 Accessibility

- Focus visible styles on interactive nav.
- `aria-label` on loading spinners and icon buttons.
- Video consult depends on visual UI — ensure keyboard paths for hang up/mute where implemented.

## 13.5 Internationalization

**Not implemented.** All copy is English hardcoded in components and `registerRoleCopy.ts`.

## 13.6 Testing

No automated test suite in repository. Manual test paths documented in README test plans and production docs.

## 13.7 Build and deployment

| Stage | Command | Output |
|-------|---------|--------|
| Dev | `npm run dev` | Vite HMR on :3000 |
| Prod build | `npm run build` | `tsc -b` + `dist/` |
| Preview | `npm run preview` | Serve `dist/` locally |

See [docs/production/deployment-steps.md](../production/deployment-steps.md).

Static hosting requirements:

- SPA fallback to `index.html` for client routes.
- Env vars baked at **build time** (`VITE_*`).

## 13.8 Observability

- No Sentry/LogRocket integrated.
- Errors surfaced to user via toast/inline text.
- Browser console may log fetch failures during development.

## 13.9 API contract drift

When frontend adds features before README updates:

1. Document in `IMPLEMENTED_FEATURES_API_GAPS.md`.
2. Add checklist entry in `docs/api/MISSING_REQUIRED_APIS.md`.
3. Optional env path override in `config.ts`.

## 13.10 Duplicate / legacy files

Maintain awareness when refactoring:

- Parallel `pages/dashboard/X.tsx` and `pages/dashboard/role/X.tsx`.
- Root `lib/*` 3-line re-exports → prefer nested canonical modules.

## 13.11 Related documentation index

| Document | Location |
|----------|----------|
| API contract | [README.md](../../README.md) |
| Local setup | [docs/setup/local-environment.md](../setup/local-environment.md) |
| Production env | [docs/production/environment-variables.md](../production/environment-variables.md) |
| API gaps | [IMPLEMENTED_FEATURES_API_GAPS.md](../../IMPLEMENTED_FEATURES_API_GAPS.md) |
| Missing APIs checklist | [docs/api/MISSING_REQUIRED_APIS.md](../api/MISSING_REQUIRED_APIS.md) |

## 13.12 Extension guidelines for contributors

1. Add route in `app/App.tsx` + page under `pages/`.
2. Add API function in `lib/api/<domain>.ts` + path helper in `config.ts`.
3. Add types + normalizer before wiring UI.
4. Use `medihubFetch` + `credentials: "include"` for protected routes.
5. Update architecture docs if introducing new layer or cross-cutting pattern.
