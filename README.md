# Salary Management Tool

> Incubyte Software Craftsperson Assessment — Full-stack HR salary management system built with strict TDD, clean architecture, and production-ready practices.

---

## Overview

A web application for HR Managers to manage salary records for an organisation of **10,000 employees**. Built with a Node.js/Express REST API, a React SPA, and a PostgreSQL database.

**Core features:**
- Paginated employee list with live search (debounced)
- Create / Edit / Delete employees via modal forms with validation
- Salary insights dashboard: min/max/avg per country, headcount, department distribution, top-5 paid job titles
- Seed script that populates 10,000 randomised employee records in < 30 seconds

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + shadcn/ui + Tailwind CSS |
| State / Fetching | TanStack Query v5 (React Query) |
| HTTP client | Axios (central instance in `frontend/src/lib/api.ts`) |
| Routing | React Router v7 (lazy-loaded routes) |
| Backend | Node.js + Express 5 + TypeScript |
| ORM | Sequelize + sequelize-typescript |
| Database | PostgreSQL (production/dev), SQLite in-memory (tests) |
| Backend tests | Jest + Supertest |
| Frontend tests | Vitest + React Testing Library |
| Deployment | Render (backend + DB) + Vercel (frontend) |

---

## Project Structure

```
salary-management-system/
├── backend/
│   ├── src/
│   │   ├── config/        # Sequelize DB config (dev/test/prod)
│   │   ├── models/        # Employee model (sequelize-typescript)
│   │   ├── migrations/    # Sequelize migration files
│   │   ├── routes/        # Express route handlers
│   │   ├── services/      # Business logic + Sequelize queries
│   │   ├── scripts/       # Seed script
│   │   └── tests/         # Jest + Supertest integration tests
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Shared UI components (shadcn/ui wrappers + dialogs)
│   │   ├── hooks/         # Custom React Query hooks
│   │   ├── lib/           # Axios instance, utility functions
│   │   ├── pages/         # Route-level page components (lazy-loaded)
│   │   ├── tests/         # Vitest + RTL component tests
│   │   └── types/         # TypeScript interfaces
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── PLANNING.md
│   ├── PROMPTS.md
│   └── TRADEOFFS.md
├── seed/
│   ├── seed.ts
│   ├── first_names.txt
│   └── last_names.txt
└── CLAUDE.md              # Project rules and conventions
```

---

## Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- **PostgreSQL** ≥ 14 running locally (for development; tests use SQLite in-memory)

---

## Running Locally

### 1. Clone and install dependencies

```bash
git clone https://github.com/your-username/salary-management-system.git
cd salary-management-system

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure backend environment

```bash
cd backend
cp .env.example .env
# Edit .env — set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
```

### 3. Create the PostgreSQL database

```bash
psql -U postgres -c "CREATE DATABASE salary_management;"
```

### 4. Run database migrations

```bash
cd backend
npm run db:migrate:run
```

### 5. Start the backend (port 5000)

```bash
cd backend
npm run dev
```

### 6. Configure frontend environment (optional)

```bash
cd frontend
cp .env.example .env
# VITE_API_URL is empty by default — Vite proxies /api/* to localhost:5000
# Only set this if your backend runs on a different host/port
```

### 7. Start the frontend (port 5173)

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser. The Vite dev server proxies all `/api/*` requests to `http://localhost:5000`.

---

## Running Tests

### Backend (Jest + Supertest — uses SQLite in-memory, no DB server needed)

```bash
cd backend
npm test              # run once
npm run test:watch    # watch mode
```

### Frontend (Vitest + React Testing Library)

```bash
cd frontend
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # coverage report
```

### All tests at a glance

| Suite | Framework | Count |
|---|---|---|
| Backend service + route tests | Jest + Supertest | 43 |
| Frontend component tests | Vitest + RTL | 35 |
| **Total** | | **78** |

---

## Seeding the Database

The seed script generates **10,000 randomised employees** using `first_names.txt` + `last_names.txt`, inserting in batches of 500 via Sequelize `bulkCreate`.

```bash
cd backend
npm run seed
```

Expected output:
```
Seeding 10000 employees in batches of 500…
  Batch 1/20 — 500 rows inserted
  Batch 2/20 — 500 rows inserted
  ...
  Batch 20/20 — 500 rows inserted
Done. Seeded 10000 employees in 18.4s
```

Target: **< 30 seconds** on a local PostgreSQL instance.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Required | Description |
|---|---|---|---|
| `NODE_ENV` | `development` | Yes | `development` / `test` / `production` |
| `PORT` | `5000` | No | Express server port |
| `DB_HOST` | `localhost` | Dev only | PostgreSQL host |
| `DB_PORT` | `5432` | Dev only | PostgreSQL port |
| `DB_NAME` | `salary_management` | Dev only | Database name |
| `DB_USER` | `postgres` | Dev only | Database user |
| `DB_PASSWORD` | — | Dev only | Database password |
| `DATABASE_URL` | — | Prod only | Full Postgres connection string (overrides individual DB_* vars) |

### Frontend (`frontend/.env`)

| Variable | Default | Required | Description |
|---|---|---|---|
| `VITE_API_URL` | `""` (empty) | No | Backend base URL. Empty = same origin (Vite proxy in dev, reverse proxy in prod) |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/employees` | Create employee |
| `GET` | `/api/employees?page=1&limit=20&search=` | List employees (paginated) |
| `GET` | `/api/employees/:id` | Get single employee |
| `PUT` | `/api/employees/:id` | Update employee |
| `DELETE` | `/api/employees/:id` | Delete employee |
| `GET` | `/api/insights?country=India` | Salary insights (country filter optional) |
| `GET` | `/health` | Health check |

---

## Deployment

| Service | Platform | URL |
|---|---|---|
| Backend API | Render | TBD |
| Frontend SPA | Vercel | TBD |

> **Note:** Deployment is in progress. Set `DATABASE_URL` in Render and `VITE_API_URL` in Vercel to the Render API URL once deployed.

---

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system diagram and layer responsibilities
- [`docs/PLANNING.md`](docs/PLANNING.md) — phase breakdown and decisions
- [`docs/TRADEOFFS.md`](docs/TRADEOFFS.md) — rationale for every major design choice
- [`docs/PROMPTS.md`](docs/PROMPTS.md) — full log of AI-assisted development prompts
- [`CLAUDE.md`](CLAUDE.md) — project rules and conventions (read this first)
