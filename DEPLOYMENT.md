# LibertyPath - Deployment Guide

This guide covers deployment with **frontend on Vercel** and **backend on Render** (recommended).

## Architecture

| Component | Platform | URL example |
|-----------|----------|-------------|
| React frontend | Vercel | `https://libertypath.site` or `https://your-app.vercel.app` |
| Node API + Postgres | Render | `https://liberty-path-api.onrender.com` |

The frontend calls the API via `REACT_APP_API_URL`. CORS on the backend allows Vercel preview URLs (`*.vercel.app`) and your custom domain.

---

## Quick checklist

### Render (backend)

1. Push code to GitHub.
2. Create **PostgreSQL** database (`liberty-path-db`).
3. Create **Web Service** from repo (Blueprint uses `render.yaml`).
4. Set `FRONTEND_URL` to your Vercel URL, e.g. `https://libertypath.site` or `https://your-app.vercel.app`.
5. Deploy — migrations and seed run automatically via `preDeployCommand`.
6. Verify: `https://<render-url>/health`

### Vercel (frontend)

1. Import the same GitHub repo in Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Create React App** (auto-detected).
4. Add environment variable:
   - `REACT_APP_API_URL` = `https://<your-render-api-url>/api/v1`
5. Deploy.
6. Open the Vercel URL and test login.

---

## Render — backend API (step by step)

### 1. Database

1. Render → **New** → **PostgreSQL**
2. Name: `liberty-path-db`
3. Create and wait for provisioning

### 2. Web service

`render.yaml` in the repo root configures:

- **Service name:** `liberty-path-api`
- **Root directory:** `backend`
- **Build:** `npm install`
- **Pre-deploy:** `npm run migrate && npm run seed`
- **Start:** `npm start`
- **Health check:** `/health`

If not using Blueprint, set manually:

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

### 3. Environment variables (Render)

Required (most are in `render.yaml`):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | From linked Postgres (auto in Blueprint) |
| `JWT_SECRET` | Strong random string (auto-generated in Blueprint) |
| `JWT_REFRESH_SECRET` | Strong random string (auto-generated in Blueprint) |
| `FRONTEND_URL` | Your Vercel URL(s), comma-separated |
| `CORS_DOMAIN_SUFFIXES` | `libertypath.site,vercel.app` (default in Blueprint) |
| `SERVE_FRONTEND` | `false` (API only) |

Optional:

| Variable | Default |
|----------|---------|
| `SERVICE_FEE_PERCENTAGE` | `15` |
| `MIN_WITHDRAWAL_AMOUNT` | `500` |
| `MAX_WITHDRAWAL_PER_WEEK` | `15000` |

### 4. Verify backend

```text
GET https://<render-url>/health
GET https://<render-url>/api-docs
```

---

## Vercel — frontend (step by step)

### 1. New project

1. [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import your GitHub repository
3. **Root Directory:** `frontend` (click Edit)
4. Build settings (defaults are fine):
   - Build Command: `npm run build` or `CI=false npm run build`
   - Output Directory: `build`

### 2. Environment variables (Vercel)

Set for **Production** (and Preview if you want preview deploys to hit production API):

| Variable | Example |
|----------|---------|
| `REACT_APP_API_URL` | `https://liberty-path-api.onrender.com/api/v1` |
| `REACT_APP_WHATSAPP_GROUP_URL` | (optional) your WhatsApp group link |

Copy from `frontend/.env.example`.

### 3. Custom domain (optional)

1. Vercel project → **Settings** → **Domains**
2. Add `libertypath.site` (or your domain)
3. Update DNS per Vercel instructions
4. Update Render `FRONTEND_URL` to include the custom domain

### 4. SPA routing

`frontend/vercel.json` rewrites all routes to `index.html` so React Router works (`/dashboard`, `/admin`, etc.).

---

## After first deploy

1. **Render:** confirm `/health` returns OK and staff roles migration ran (check logs for `add-staff-position-roles`).
2. **Vercel:** open the site, open browser DevTools → Network, confirm API calls go to your Render URL (not `localhost`).
3. **CORS:** if you see CORS errors, add your exact Vercel URL to Render `FRONTEND_URL` or `CORS_ORIGINS`.
4. **Login:** test admin and a regular user account.

---

## Local development

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run migrate && npm run seed
npm run dev

# Frontend (separate terminal)
cd frontend
cp .env.example .env
npm install
npm start
```

Frontend: `http://localhost:3005` → API: `http://localhost:5000/api/v1`

---

## Legacy: single Render service (API + frontend)

The backend can still serve a built React app from the same origin if `frontend/build` exists and `SERVE_FRONTEND` is not `false`. This is **not** used when deploying frontend on Vercel.

---

## Troubleshooting

### CORS errors in browser

- Set `FRONTEND_URL` on Render to your full Vercel origin (e.g. `https://libertypath.site`).
- `*.vercel.app` is allowed automatically; custom domains need `FRONTEND_URL` or `CORS_DOMAIN_SUFFIXES`.

### API calls go to wrong host

- Check `REACT_APP_API_URL` in Vercel → redeploy after changing env vars.
- URL must end with `/api/v1` (no trailing slash after `v1`).

### Render deploy stuck / unhealthy

- Health check path: `/health`
- Check **Pre-deploy** logs for migration failures
- Postgres connection pool is limited (`min: 0`, `max: 10`)

### Vercel 404 on refresh

- Ensure `frontend/vercel.json` is committed and Root Directory is `frontend`.

---

## See also

- `backend/.env.example` — backend environment template
- `frontend/.env.example` — frontend environment template
- `QUICKSTART.md` — local setup
- `SETUP.md` — detailed configuration
