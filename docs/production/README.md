# Production deployment (MediHub frontend)

This folder explains **environment files** (including `.env.development`) and how to deploy the Vite app to production.

| Document | What it covers |
|----------|----------------|
| [environment-variables.md](./environment-variables.md) | What `.env.development` is for, dev vs production, every `VITE_*` variable |
| [deployment-steps.md](./deployment-steps.md) | Checklist: build, hosting, backend CORS, OAuth, optional reverse proxy |

**Related**

- [docs/setup/local-environment.md](../setup/local-environment.md) — **local** `.env` files (gitignored)
- [`.env.example`](../../.env.example), [`.env.development.example`](../../.env.development.example) — committed templates
- [`.env.production.example`](../../.env.production.example) — production build template
- [README.md — Environment Setup](../../README.md#environment-setup) — API contract and defaults
- [docs/api/README.md](../api/README.md) — backend endpoints the UI expects
