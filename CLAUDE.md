# CLAUDE.md — Salary Management Tool
## Incubyte Assessment | Software Craftsperson Role

---

## Project Goal
Build a minimal yet usable full-stack Salary Management Tool for an organization
with 10,000 employees. The primary user is an HR Manager.

---

## Tech Stack
- **Backend:** Node.js + Express + TypeScript + Sequelize ORM
- **Database:** PostgreSQL
- **Frontend:** React + TypeScript + Vite + shadcn/ui
- **Testing:** Jest + Supertest (backend), Vitest + React Testing Library (frontend)
- **Deployment:** Render (backend + PostgreSQL) + Vercel (frontend)

---

## Non-Negotiable Rules

1. **Always follow TDD** — write the failing test FIRST, then implement, then refactor
2. **Never write implementation before a test exists**
3. **Commit after every Red → Green → Refactor cycle**
4. **Never bulk-load 10k rows without Sequelize bulkCreate**
5. **Never return all 10k employees in one API response — always paginate**
6. **All code must be TypeScript — no plain JS files**
7. **Use Sequelize migrations — never sync({ force: true }) in production**

---

## Commit Message Convention
feat: add employee creation with validation
test: add salary insight unit tests
chore: scaffold backend project structure
fix: correct average salary calculation for edge case
docs: add architecture notes to /docs

---

## Project Structure
salary-management/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   ├── migrations/
│   │   ├── config/
│   │   │   └── database.ts
│   │   └── tests/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── tests/
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── PROMPTS.md
│   ├── TRADEOFFS.md
│   └── PLANNING.md
├── seed/
│   ├── seed.ts
│   ├── first_names.txt
│   └── last_names.txt
└── CLAUDE.md

---

## Sequelize Setup Rules
- Use `sequelize-typescript` for decorator-based models
- Define all models in `/src/models/` as TypeScript classes
- Use Sequelize migrations for all schema changes (never alter DB manually)
- Use `.env` for DB credentials — never hardcode
- Separate DB config for test environment (use a test DB or in-memory SQLite for tests)

---

## Database Config Pattern
// src/config/database.ts
- development → PostgreSQL (local)
- test        → SQLite in-memory (fast, no setup needed for unit tests)
- production  → PostgreSQL (Render)

---

## Employee Data Model
| Field          | Type       | Rules                          |
|----------------|------------|--------------------------------|
| id             | UUID       | auto-generated                 |
| fullName       | STRING     | required, not empty            |
| jobTitle       | STRING     | required                       |
| country        | STRING     | required                       |
| department     | STRING     | required                       |
| salary         | DECIMAL    | required, must be > 0          |
| currency       | STRING     | default "USD"                  |
| employmentType | ENUM       | FULL_TIME, PART_TIME, CONTRACT |
| joinDate       | DATEONLY   | required                       |
| createdAt      | DATE       | auto                           |
| updatedAt      | DATE       | auto                           |

---

## API Endpoints to Build
- POST   /api/employees          → Create employee
- GET    /api/employees          → List (paginated, ?page=1&limit=20)
- GET    /api/employees/:id      → Get single employee
- PUT    /api/employees/:id      → Update employee
- DELETE /api/employees/:id      → Delete employee
- GET    /api/insights           → Salary insights (?country=IN&jobTitle=Engineer)

---

## Insights the UI Must Show
- Min / Max / Average salary per country
- Average salary for a job title in a country
- Headcount per country
- Salary distribution by department
- Top 5 highest paid job titles

---

## Sequelize Query Rules
- Use Sequelize `fn`, `col`, `literal` for aggregations (MIN, MAX, AVG)
- Always use `findAndCountAll` for paginated responses
- Use `attributes` to select only needed columns — never SELECT *
- Use `where` clauses with parameterized values — never raw string interpolation

---

## TDD Cycle to Follow (STRICTLY)
1. Write a failing test → commit "test: [what it tests]"
2. Write minimum code to pass → commit "feat: [what was implemented]"
3. Refactor if needed → commit "refactor: [what was cleaned up]"

---

## Test Environment Setup
- Use SQLite (in-memory) for unit & integration tests — no real DB needed
- Configure Sequelize to use `dialect: 'sqlite', storage: ':memory:'` in test env
- Run migrations on test DB before each test suite
- Truncate tables between tests for isolation

---

## Seed Script Rules
- Combine first_names.txt + last_names.txt to generate full names
- Use Sequelize `bulkCreate` with `{ ignoreDuplicates: true }`
- Chunk 10k records into batches of 500 for performance
- Randomize: country, jobTitle, salary, department, employmentType, joinDate
- Log time taken — target under 30 seconds

---

## Artifacts to Maintain in /docs
After each major phase, update:
- PLANNING.md — decisions made
- PROMPTS.md — prompts used with AI
- TRADEOFFS.md — why you chose X over Y
- ARCHITECTURE.md — updated diagram

---

## React Performance Rules

1. **Always use TanStack Query v5 for ALL server state** — no local `useState` + `useEffect` fetch patterns
2. **Never fetch data directly in a component** — always use a custom hook from `src/hooks/`
3. **Wrap all list and table components with `React.memo`** — prevents re-renders when parent state changes but props are unchanged
4. **Use `useCallback` for all handlers passed as props** — keeps child `memo` comparisons stable
5. **Use `useMemo` for all computed or derived values** — e.g. filtered lists, formatted totals, derived booleans from query data
6. **All routes must be lazy-loaded with `React.lazy` and `<Suspense>`** — each page becomes a separate JS chunk; Vite splits the bundle automatically
7. **Search inputs must always use the `useDebounce` hook with a 300 ms delay** — prevents an API call on every keystroke
8. **Global `QueryClient` config: `staleTime` 5 min, `gcTime` 10 min** — HR data doesn't change second-to-second; avoids redundant refetches while keeping memory bounded

---

## Definition of Done
- [ ] All CRUD operations work via UI
- [ ] Insights dashboard shows all required metrics
- [ ] Seed script populates 10k employees efficiently
- [ ] Unit tests cover all service-layer logic
- [ ] App is deployed and accessible via URL
- [ ] Loom video demo recorded
- [ ] /docs folder has all artifacts
- [ ] Git history shows clean TDD progression