# Field-Line Admin Dashboard

Web administration portal for the Field-Line policing platform. This first release lets a Platform Administrator:

- sign in using the shared Field-Line API;
- replace a temporary password on first login;
- view and search registered police stations;
- create draft stations;
- review and approve stations.

## Local development

Requirements: Node.js 22 or newer.

```bash
cp .env.example .env.local
npm install
npm run dev
```

The development site is available at `http://localhost:5173`.

## Environment

```text
VITE_API_BASE_URL=https://field-line-api-dev.onrender.com/api/v1
```

Never add secrets or database credentials to a `VITE_*` variable. Vite exposes these variables to the browser.

## Vercel deployment

1. Import `Cryptware-Systems-Limited/field-line-admins-frontend` into Vercel.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add `VITE_API_BASE_URL` using the API URL above.
6. Deploy.
7. Add the final Vercel origin to the API service's `CORS_ORIGINS` setting on Render.

The included `vercel.json` sends client-side routes to the React application.

## Security notes

- Access tokens are kept only in application memory and disappear on refresh or tab closure.
- Protected calls use the bearer access token issued by the backend.
- The portal verifies that the authenticated user has the `PLATFORM_ADMIN` role.
- Station changes remain enforced and audited by the backend.
- Generated output in `dist/` is not source code and must not be edited.
