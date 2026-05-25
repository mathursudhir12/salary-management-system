# PROMPTS.md — AI-Assisted Development Log

## Tool Used

**Claude Code** (Anthropic) — CLI-based AI coding assistant  
Model: Claude Sonnet 4.6  
Project: Salary Management Tool — Incubyte Software Craftsperson Assessment

---

## How AI Was Used

Claude Code was used as a **pair programmer** throughout the entire project.
All architectural decisions, file contents, and commit messages were reviewed before
acceptance. The TDD discipline (test-first) was enforced in all phases.

Claude Code does **not** push code — every commit is reviewed by the developer.
The AI generates candidates; the developer accepts, modifies, or rejects them.

---

## Prompts Used (Chronological)

---

### Prompt 1 — Backend Scaffold

```
Read CLAUDE.md fully.

Initialize the backend folder only:
- Node + Express + TypeScript
- Install: express cors dotenv helmet morgan uuid
- Install: sequelize sequelize-typescript pg pg-hstore reflect-metadata
- Install dev: typescript ts-node ts-node-dev @types/node @types/express @types/cors @types/uuid
- Create tsconfig.json with strict:true, experimentalDecorators:true,
  emitDecoratorMetadata:true, target ES2022
- Create folder structure: src/config, src/models, src/routes, src/services,
  src/middlewares, src/migrations, src/tests
- Create src/config/database.ts (dev=postgres, test=sqlite in-memory, prod=postgres)
- Create a basic src/index.ts with express app running on port 5000
- Create .env.example with all required variables
- Do NOT write any business logic yet
```

**What was generated:**
- `backend/package.json` with full dependency list and npm scripts
- `backend/tsconfig.json` with strict, experimentalDecorators, emitDecoratorMetadata, ES2022
- `backend/src/config/database.ts` — multi-env Sequelize config
- `backend/src/index.ts` — Express app with helmet, cors, morgan, health check, error handler
- `backend/.env.example`
- `backend/.gitignore`
- All empty `src/` subdirectories

**Commit:** `chore: scaffold backend project structure`

---

### Prompt 2 — Frontend Scaffold

```
Read CLAUDE.md fully.

Initialize the frontend folder only:
- Vite + React + TypeScript (latest)
- Install: shadcn/ui, tailwindcss, axios, react-router-dom, react-query
- Install dev: @types/react @types/react-dom
- Setup tailwind config
- Setup shadcn/ui init
- Create folder structure: src/components, src/pages, src/hooks, src/services, src/types
- Create a basic App.tsx with react-router-dom setup
- Create placeholder pages: EmployeesPage.tsx, InsightsPage.tsx
- Create a basic Navbar with links to Employees and Insights
- Do NOT connect to backend yet
```

**What was generated:**
- `frontend/vite.config.ts` — `@vitejs/plugin-react` + `@` alias → `./src`
- `frontend/tsconfig.json` — strict, react-jsx, vite/client types, path alias
- `frontend/tailwind.config.js` — shadcn/ui color tokens, darkMode, content globs
- `frontend/src/index.css` — Tailwind directives + CSS variables (light + dark)
- `frontend/src/lib/utils.ts` — `cn()` helper
- `frontend/src/components/ui/button.tsx` — shadcn Button with CVA variants
- `frontend/src/components/Navbar.tsx` — NavLink-based nav with active-state styling
- `frontend/src/pages/EmployeesPage.tsx` — placeholder
- `frontend/src/pages/InsightsPage.tsx` — placeholder
- `frontend/src/App.tsx` — BrowserRouter + Routes + redirect `/` → `/employees`
- `frontend/src/main.tsx` — QueryClientProvider (5-min staleTime) wrapping App

**Commit:** `chore: scaffold frontend with Vite, React, TypeScript, Tailwind, shadcn/ui, react-router-dom`

---

### Prompt 3 — Documentation

```
Read CLAUDE.md fully.

Create the /docs folder with these 4 files:
1. PLANNING.md — explain the problem breakdown, phases planned, user persona analysis
2. ARCHITECTURE.md — text-based diagram showing frontend → backend → postgres
3. TRADEOFFS.md — explain: Sequelize vs Prisma, PostgreSQL vs SQLite, shadcn/ui
   choice, pagination decision, bulkCreate for seeding
4. PROMPTS.md — document that AI was used, list the prompts used so far

Commit: "docs: add planning, architecture, tradeoffs and prompts artifacts"
```

**What was generated:**
`docs/PLANNING.md`, `docs/ARCHITECTURE.md`, `docs/TRADEOFFS.md`, `docs/PROMPTS.md`

**Commit:** `docs: add planning, architecture, tradeoffs and prompts artifacts`

---

### Prompt 4 — Employee Model + Migration (TDD Red → Green)

```
Read CLAUDE.md fully.

TDD Red phase: add failing unit tests for the Employee model.
TDD Green phase: implement Employee model and migration to pass all tests.

Follow strict TDD: test commit first, then implementation commit.
Commit messages:
  test: add failing unit tests for Employee model
  feat: add Employee model and migration with all required fields
```

**What was generated:**
- `backend/src/tests/employee.service.test.ts` — model validation tests (Red)
- `backend/src/models/Employee.ts` — sequelize-typescript model with all fields
- `backend/src/migrations/001-create-employees.ts` — up/down migration

**Commits:**
- `test: add failing unit tests for Employee model` (Red)
- `feat: add Employee model and migration with all required fields` (Green)

---

### Prompt 5 — Employee Service + CRUD Routes (TDD Red → Green)

```
Read CLAUDE.md fully.

TDD Red phase: add failing unit tests for the Employee service.
TDD Green phase: implement Employee service to pass all tests.

Also add failing route tests, then implement the routes.

Follow strict TDD per CLAUDE.md. Commit after each phase.
```

**What was generated:**
- `backend/src/tests/employee.service.test.ts` — service-layer unit tests (Red)
- `backend/src/services/EmployeeService.ts` — CRUD + pagination + search (Green)
- `backend/src/tests/employee.routes.test.ts` — route integration tests (Red)
- `backend/src/routes/employee.routes.ts` — all 5 CRUD endpoints (Green)

**Commits:**
- `test: add failing unit tests for employee service` (Red)
- `feat: implement employee service to pass all unit tests` (Green)

---

### Prompt 6 — Insights Service + Route (TDD Red → Green)

```
Read CLAUDE.md fully.

TDD Red → Green for Insights:
- Failing tests for InsightsService (min/max/avg/headcount/top5/deptDistribution)
- Implement InsightsService using Sequelize fn, col, literal
- Failing tests for GET /api/insights route
- Implement route with optional ?country filter

Commit after each Red and Green phase.
```

**What was generated:**
- `backend/src/tests/insights.service.test.ts` — service tests (Red)
- `backend/src/services/InsightsService.ts` — all aggregation queries (Green)
- `backend/src/tests/insights.routes.test.ts` — route integration tests (Red)
- `backend/src/routes/insights.routes.ts` — GET /api/insights with country filter (Green)

**Commits:**
- `test: add failing tests for insights service` (Red)
- `feat: implement insights service with aggregation queries` (Green)

---

### Prompt 7 — Frontend Employee List Page

```
Read CLAUDE.md fully.

Build the Employees page:
- Fetch paginated employees from GET /api/employees via react-query
- Search bar with 300ms debounce
- shadcn/ui Table with skeleton loading rows
- Ellipsis pagination (Prev / page numbers / Next)
- Add shadcn Input, Table, Badge, Skeleton components
- useDebounce hook in src/hooks/
- useEmployees hook in src/hooks/

Connect frontend to backend via Vite proxy.
```

**What was generated:**
- `frontend/src/hooks/useDebounce.ts`
- `frontend/src/hooks/useEmployees.ts`
- `frontend/src/components/ui/input.tsx`, `table.tsx`, `badge.tsx`, `skeleton.tsx`
- `frontend/src/types/employee.ts`
- `frontend/src/pages/EmployeesPage.tsx` — full paginated table with search

---

### Prompt 8 — Employee CRUD Modals (TDD Red → Green)

```
Read CLAUDE.md fully.

Add CRUD modals to the Employees page:
- Add Employee button → opens shadcn Dialog with form (all fields from CLAUDE.md)
- Edit icon on each row → opens same form prefilled
- Delete icon → opens confirmation Dialog before deleting
- Use react-query mutations for POST, PUT, DELETE
- Invalidate and refetch employee list after each mutation
- Show toast notifications on success and error
- Follow TDD: failing tests first, then implement

Commit: 'feat: add create, edit and delete employee modals with form validation'
```

**What was generated:**
- `frontend/src/tests/EmployeeFormDialog.test.tsx` — 13 tests (Red)
- `frontend/src/tests/DeleteConfirmDialog.test.tsx` — 7 tests (Red)
- `frontend/src/components/ui/dialog.tsx` — shadcn Dialog wrapping Radix
- `frontend/src/components/ui/label.tsx` — shadcn Label
- `frontend/src/components/ui/sonner.tsx` — Sonner Toaster wrapper
- `frontend/src/hooks/useCreateEmployee.ts`
- `frontend/src/hooks/useUpdateEmployee.ts`
- `frontend/src/hooks/useDeleteEmployee.ts`
- `frontend/src/components/EmployeeFormDialog.tsx`
- `frontend/src/components/DeleteConfirmDialog.tsx`
- Updated `frontend/src/pages/EmployeesPage.tsx` with action columns
- Updated `frontend/src/main.tsx` with `<Toaster />`

**Key technical challenges solved:**
- Radix Dialog sets `body { pointer-events: none }` — fixed with `PointerEventsCheckLevel.Never` in tests
- `aria-hidden` on background content when dialog open — fixed with `within(getByRole('dialog'))`
- Generic `SalaryTable<T>` — two-step memo cast pattern

**Commits:**
- `test: add failing tests for employee CRUD modals` (Red)
- `feat: add create, edit and delete employee modals with form validation` (Green)

---

### Prompt 9 — Insights Page (TDD Red → Green)

```
Read CLAUDE.md fully.

Build the Insights page:
- Country selector dropdown (fetched dynamically from headcountByCountry)
- Show cards: Min Salary, Max Salary, Average Salary, Headcount for selected country
- Table: Average salary by Job Title in selected country
- Table: Salary distribution by Department
- Table: Top 5 highest paid job titles globally
- Use shadcn/ui Card, Table components
- Use react-query to fetch from GET /api/insights
- Follow TDD for the new avgSalaryByTitle backend feature

Commit: 'feat: add insights dashboard with salary metrics and filters'
```

**What was generated:**
- Backend: `getAvgSalaryByTitleForCountry` in InsightsService + route update (TDD)
- `frontend/src/types/insights.ts`
- `frontend/src/hooks/useInsights.ts`
- `frontend/src/components/ui/card.tsx`
- `frontend/src/tests/InsightsPage.test.tsx` — 15 tests (Red)
- `frontend/src/pages/InsightsPage.tsx` — full dashboard (Green)

**Commits:**
- `test: add failing tests for avgSalaryByTitle insights endpoint` (Red)
- `feat: add avgSalaryByTitle to insights service and route` (Green)
- `test: add failing tests for insights dashboard page` (Red)
- `feat: add insights dashboard with salary metrics and filters` (Green)

---

### Prompt 10 — React Performance Optimisations

```
Apply React.memo to all components.
Use useCallback for all handlers.
Use useMemo for any derived/computed data.
All data fetching must go through the custom hooks in src/hooks/ —
never call axios directly from a component.
```

**What was applied:**
- `React.memo` on every component: pages, custom components, sub-components,
  all shadcn/ui primitive wrappers
- `useCallback` on all event handlers in every component
- `useMemo` on all derived values (employees list, pagination range, insight arrays)
- Generic `SalaryTable` uses two-step memo cast: `memo(Inner) as typeof Inner`

**Commit:** `refactor: apply React.memo, useCallback, useMemo across all components`

---

### Prompt 11 — Lazy-loaded Routes

```
Can you add the lazy suspense on the routes?
```

**What was applied:**
- Converted `EmployeesPage` and `InsightsPage` to `React.lazy(() => import(...))`
- Wrapped `<Routes>` in `<Suspense fallback={<PageLoader />}>`
- `Navbar` kept as static import (renders immediately in every route)

**Commit:** `feat: lazy-load route pages with React.lazy and Suspense`

---

### Prompt 12 — React Performance Rules in CLAUDE.md

```
Read CLAUDE.md fully.

Add a new section to CLAUDE.md called "React Performance Rules":
- Always use TanStack Query v5 for ALL server state
- Never fetch data directly in a component — always use custom hooks from src/hooks/
- Wrap all list and table components with React.memo
- Use useCallback for all handlers passed as props
- Use useMemo for all computed or derived values
- All routes must be lazy loaded with React.lazy and Suspense
- Search inputs must always use useDebounce hook with 300ms delay
- Global QueryClient config: staleTime 5min, gcTime 10min

Commit: "docs: update CLAUDE.md with react performance rules"
```

**What was generated:**
- New "React Performance Rules" section added to `CLAUDE.md` with rationale for each rule

**Commit:** `docs: update CLAUDE.md with react performance rules`

---

### Prompt 13 — Final Polish

```
Read CLAUDE.md fully.

Final polish:
- Add README.md at root with: project overview, tech stack, how to run locally,
  how to run tests, how to seed, deployed URL
- Update docs/PROMPTS.md with all prompts used in this project
- Update docs/TRADEOFFS.md with any new decisions made
- Check all tests still pass
- Check .env.example is complete

Commit: "docs: finalize README and update all artifact docs"
```

**What was generated:**
- `README.md` — comprehensive project documentation
- `frontend/.env.example` — documents `VITE_API_URL`
- `frontend/src/main.tsx` — added `gcTime: 10min` to QueryClient config
- Updated `docs/PROMPTS.md` — this file, complete log of all 13 prompts
- Updated `docs/TRADEOFFS.md` — new decisions #7–#11

**Tests at commit:** 43 backend + 35 frontend = **78 passing**

**Commit:** `docs: finalize README and update all artifact docs`

---

## Notes on AI-Assisted Development

1. **AI generates, developer verifies.** Every file was reviewed before commit.
2. **Prompt specificity matters.** Vague prompts produce vague scaffolds.
3. **Errors are expected.** Radix pointer-events, TypeScript 6 deprecations, and
   generic-memo incompatibilities were all caught and fixed iteratively.
4. **TDD is not automated.** The test-first discipline is enforced by the developer.
   The AI generates both tests and implementations, but the developer must verify
   the tests fail before accepting the implementation.
5. **Context window management.** Long sessions were summarised and resumed;
   memory files tracked key decisions across context resets.
