# ARCHITECTURE.md — Salary Management Tool

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (HR Manager)                      │
│                                                                   │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                  React SPA (Vercel)                       │  │
│   │                                                           │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │  │
│   │  │  Navbar     │  │EmployeesPage│  │  InsightsPage   │  │  │
│   │  │(react-router│  │ - DataTable │  │  - Metric cards │  │  │
│   │  │  NavLink)   │  │ - Pagination│  │  - Filters      │  │  │
│   │  └─────────────┘  │ - CRUD modal│  │  - Charts       │  │  │
│   │                   └──────┬──────┘  └────────┬────────┘  │  │
│   │                          │                   │           │  │
│   │              ┌───────────┴───────────────────┘           │  │
│   │              │    TanStack Query (useQuery / useMutation) │  │
│   │              │    axios HTTP client                       │  │
│   │              │    src/services/ (API call wrappers)       │  │
│   └──────────────┼────────────────────────────────────────────┘  │
└──────────────────┼──────────────────────────────────────────────┘
                   │  HTTPS / JSON  (REST API)
                   │
┌──────────────────▼──────────────────────────────────────────────┐
│                   Express API Server (Render)                     │
│                   Node.js + TypeScript                            │
│                                                                   │
│   src/index.ts                                                    │
│   ├── helmet (security headers)                                   │
│   ├── cors (allow Vercel origin)                                  │
│   ├── morgan (request logging)                                    │
│   └── express.json()                                             │
│                                                                   │
│   src/routes/                                                     │
│   ├── POST   /api/employees        → create                       │
│   ├── GET    /api/employees        → list (paginated)             │
│   ├── GET    /api/employees/:id    → single                       │
│   ├── PUT    /api/employees/:id    → update                       │
│   ├── DELETE /api/employees/:id    → delete                       │
│   └── GET    /api/insights         → aggregations                 │
│                                                                   │
│   src/services/                                                   │
│   ├── EmployeeService  (CRUD, pagination, validation)             │
│   └── InsightsService  (MIN/MAX/AVG, headcount, top-5)           │
│                                                                   │
│   src/models/                                                     │
│   └── Employee.ts  (Sequelize-TypeScript @Table @Column)          │
│                                                                   │
│   src/migrations/                                                 │
│   └── 001-create-employees.ts                                     │
│                                                                   │
│   src/config/database.ts                                          │
│   ├── test → SQLite :memory:                                      │
│   ├── dev  → PostgreSQL (local .env)                              │
│   └── prod → PostgreSQL (DATABASE_URL, SSL)                      │
│                                                                   │
└──────────────────┬──────────────────────────────────────────────┘
                   │  Sequelize ORM (pg driver)
                   │  Parameterized queries only
                   │
┌──────────────────▼──────────────────────────────────────────────┐
│               PostgreSQL Database (Render managed)               │
│                                                                   │
│   Table: employees                                                │
│   ┌──────────────────┬──────────────┬───────────────────────┐   │
│   │ Column           │ Type         │ Constraints           │   │
│   ├──────────────────┼──────────────┼───────────────────────┤   │
│   │ id               │ UUID         │ PK, auto-generated    │   │
│   │ fullName         │ VARCHAR      │ NOT NULL              │   │
│   │ jobTitle         │ VARCHAR      │ NOT NULL              │   │
│   │ country          │ VARCHAR      │ NOT NULL              │   │
│   │ department       │ VARCHAR      │ NOT NULL              │   │
│   │ salary           │ DECIMAL(12,2)│ NOT NULL, > 0         │   │
│   │ currency         │ VARCHAR(3)   │ DEFAULT 'USD'         │   │
│   │ employmentType   │ ENUM         │ FULL_TIME/PART_TIME/  │   │
│   │                  │              │ CONTRACT              │   │
│   │ joinDate         │ DATE         │ NOT NULL              │   │
│   │ createdAt        │ TIMESTAMPTZ  │ auto                  │   │
│   │ updatedAt        │ TIMESTAMPTZ  │ auto                  │   │
│   └──────────────────┴──────────────┴───────────────────────┘   │
│                                                                   │
│   Indexes (planned):                                              │
│   - idx_employees_country       (for insights queries)           │
│   - idx_employees_department    (for distribution queries)        │
│   - idx_employees_jobTitle      (for top-5 query)                │
└──────────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### Frontend — React SPA (Vercel)

| Concern | Handled by |
|---|---|
| Routing | `react-router-dom` `BrowserRouter` + `Routes` |
| Server state | `@tanstack/react-query` — caching, loading, error states |
| HTTP calls | `axios` wrapped in `src/services/` functions |
| UI components | `shadcn/ui` + Tailwind CSS |
| Type safety | TypeScript strict mode; shared types in `src/types/` |

The frontend **never** fetches all 10,000 employees. Every list request includes `?page=N&limit=20`.

### Backend — Express API (Render)

| Concern | Handled by |
|---|---|
| Routing | Express `Router` per resource |
| Validation | Service layer + Sequelize model validators |
| Pagination | `findAndCountAll` with `limit` + `offset` |
| Aggregations | Sequelize `fn`, `col`, `literal` (no raw SQL strings) |
| Security | `helmet`, parameterized queries, no SQL interpolation |
| Logging | `morgan` request logger |

### Database — PostgreSQL (Render)

All schema changes go through Sequelize migrations — never `sync({ force: true })` in production.
The test environment uses an SQLite in-memory DB so tests are fast, isolated, and require no running server.

---

## Data Flow: List Employees (paginated)

```
HR Manager clicks "Next page"
        │
        ▼
TanStack Query detects page param change
        │
        ▼
axios.get('/api/employees?page=2&limit=20')
        │
        ▼
Express GET /api/employees handler
        │
        ▼
EmployeeService.findAll({ page: 2, limit: 20 })
        │  → Employee.findAndCountAll({ limit: 20, offset: 20, attributes: [...] })
        ▼
PostgreSQL: SELECT id, fullName, ... FROM employees LIMIT 20 OFFSET 20
        │
        ▼
JSON response: { data: [...20 employees], total: 10000, page: 2, totalPages: 500 }
        │
        ▼
TanStack Query caches result for 5 minutes
        │
        ▼
React re-renders DataTable with new rows
```

---

## Deployment Architecture

```
Developer pushes to GitHub main branch
        │
        ├─── Render detects push
        │    └── Runs: npm install && npm run build && npm start
        │         └── Serves API on https://salary-api.onrender.com
        │
        └─── Vercel detects push
             └── Runs: npm install && npm run build
                  └── Serves SPA on https://salary-manager.vercel.app
```

Environment variables:

| Variable | Where set | Used by |
|---|---|---|
| `DATABASE_URL` | Render dashboard | Backend (prod DB connection) |
| `NODE_ENV=production` | Render dashboard | Backend (disables logging, enables SSL) |
| `VITE_API_URL` | Vercel dashboard | Frontend (axios baseURL) |
