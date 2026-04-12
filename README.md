# African Business Club Alumni Platform (V1 MVP)

React + Node implementation aligned with the uploaded specification (`cahier_des_charges_alumni-3.pdf`).

## Implemented Scope

### Authentication and Member Access
- Email/password registration and login
- Password complexity enforcement
- Terms consent required at registration
- JWT authentication and protected routes
- Role-based access (`member`, `moderator`, `admin`)

### Alumni Directory
- Search by text, promotion, sector, city, availability
- Sorting by relevance, name, promotion
- Pagination metadata
- Profile visibility controls per field
- Profile masking option

### Member Space
- Dashboard with latest news, suggestions, unread notification count
- Profile editing (professional data, skills/interests, privacy toggles)
- Resources page for member-only links
- Account deletion endpoint (RGPD right to erasure)

### News and Institutional Content
- Public article listing with category/tag filtering
- Admin article publishing
- Optional urgent publication flag

### Notifications
- In-app notification center
- Mark as read and archive
- Automatic notifications on profile updates, article publication, and profile views

### Administration
- Member list with status and role
- Status and role update actions
- CSV export of users
- Basic admin stats endpoint

## Project Structure

- `frontend/`: React + Vite application (hexagonal layering)
- `backend/`: Express REST API (hexagonal layering)
- `backend/data/db.json`: JSON persistence storage (seeded data)

### Hexagonal Layout

- Backend domain: `backend/src/domain/`
- Backend application: `backend/src/application/`
- Backend infrastructure: `backend/src/infrastructure/`
- Backend adapters (HTTP): `backend/src/adapters/http/`
- Backend composition root: `backend/src/server.js`
- Frontend domain: `frontend/src/domain/`
- Frontend application: `frontend/src/application/`
- Frontend infrastructure: `frontend/src/infrastructure/`
- Frontend adapters (router/UI): `frontend/src/adapters/`
- Frontend composition root: `frontend/src/App.jsx`

Detailed architecture notes: `docs/ARCHITECTURE.md`

## Run Locally

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API runs on `http://localhost:4000`.

TypeScript build and production run:

```bash
cd backend
npm run build
npm start
```

### 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Type check frontend:

```bash
cd frontend
npm run typecheck
```

Frontend runs on `http://localhost:5173` and points to backend API.

## Demo Accounts

- Admin: `admin@abc.local` / `Admin1234`
- Member: `member@abc.local` / `Member1234`

## Main API Endpoints

- `GET /api/v1/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/me`
- `PUT /api/v1/me/profile`
- `DELETE /api/v1/me`
- `GET /api/v1/alumni`
- `GET /api/v1/alumni/:id`
- `GET /api/v1/articles`
- `GET /api/v1/dashboard`
- `GET /api/v1/resources`
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`
- `PATCH /api/v1/notifications/:id/archive`
- `POST /api/v1/admin/articles`
- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:id/status`
- `PATCH /api/v1/admin/users/:id/role`
- `GET /api/v1/admin/users/export.csv`
- `GET /api/v1/admin/stats`

## Deployment

See [docs/DEPLOY.md](docs/DEPLOY.md) for the full IONOS deployment guide (Docker Compose + GitHub Actions CI/CD).

## Notes

- Persistence is JSON-file based for fast MVP delivery. For production, migrate to PostgreSQL + Prisma.
- Security hardening for production should add CSRF strategy, refresh-token rotation, stricter CORS, and audit logs.
- Events/registrations, payments, mobile app, chat/forum stay out-of-scope for V1 per the specification.
