# PLANNING.md — Salary Management Tool

## Problem Statement

An HR Manager at an organization with **10,000 employees** needs a tool to:
- Create, view, update, and delete employee records
- View salary insights (min/max/avg by country, department, job title)
- Seed the database efficiently without hitting performance limits
- Access the tool from a browser, anywhere

The system must be **production-ready**: paginated, type-safe, tested, and deployable.

---

## User Persona

**Name:** Priya (HR Manager)  
**Technical level:** Non-technical — she uses web interfaces, not CLIs  
**Primary tasks:**
1. Add a new hire to the system
2. Update salary after a promotion
3. Look up how many engineers are in India and what they earn on average
4. Generate insights for quarterly reporting

**Pain points she must NOT face:**
- Waiting for a page to load 10,000 rows
- Losing data on accidental mis-click (destructive ops must confirm)
- Seeing raw error messages from the server

---

## Phase Breakdown

### Phase 0 — Scaffold (✅ Done)
- Initialize backend: Node + Express + TypeScript + Sequelize
- Initialize frontend: Vite + React + TypeScript + shadcn/ui
- Set up project structure, tsconfig, Tailwind, routing

### Phase 1 — Employee CRUD (Backend + TDD)
- Write failing test for Employee model validation
- Create Employee model (Sequelize-TypeScript decorators)
- Write migration for `employees` table
- Write failing tests for each API endpoint
- Implement routes → services → Sequelize queries
- All paginated (never return all 10k rows)

### Phase 2 — Employee CRUD (Frontend)
- EmployeesPage: paginated table with shadcn DataTable
- Create Employee modal/form with validation
- Edit Employee inline or via modal
- Delete with confirmation dialog
- Connect to backend via axios + TanStack Query

### Phase 3 — Salary Insights (Backend + TDD)
- Write failing tests for each insight query
- Implement InsightsService using Sequelize `fn`, `col`, `literal`
- Min/Max/Avg salary per country
- Average salary for job title in country
- Headcount per country
- Salary distribution by department
- Top 5 highest paid job titles

### Phase 4 — Salary Insights (Frontend)
- InsightsPage: cards + charts for each metric
- Filter controls (country, job title)
- Responsive layout using shadcn/ui Card + Table

### Phase 5 — Seed Script
- Combine first_names.txt + last_names.txt
- Generate 10,000 randomized employees
- Sequelize `bulkCreate` in batches of 500
- Log time — target < 30 seconds

### Phase 6 — Deployment
- Deploy backend + PostgreSQL to Render
- Deploy frontend to Vercel
- Set environment variables (DATABASE_URL, VITE_API_URL)
- Smoke test in production

### Phase 7 — Documentation + Demo
- Update all /docs artifacts
- Record Loom video demo
- Final README with setup instructions

---

## Key Decisions Made During Planning

| Decision | Rationale |
|---|---|
| Paginate all list endpoints | 10k rows would freeze the UI and exhaust DB memory |
| SQLite for tests | No PostgreSQL server needed in CI; tests run in-memory, fast |
| TDD cycle strictly | Ensures every feature has a regression harness before shipping |
| shadcn/ui over MUI/Antd | Headless + Tailwind = full design control, smaller bundle |
| Sequelize over Prisma | Decorator-based models are natural for OOP style; migration tooling mature |
| bulkCreate in 500-row chunks | Avoids hitting PostgreSQL's parameter limit (~65k) and keeps memory bounded |

---

## Definition of Done (Checklist)

- [ ] All CRUD operations work via UI
- [ ] Insights dashboard shows all required metrics
- [ ] Seed script populates 10k employees in < 30 seconds
- [ ] Unit tests cover all service-layer logic
- [ ] App is deployed and accessible via public URL
- [ ] Loom video demo recorded
- [ ] /docs folder has all artifacts up to date
- [ ] Git history shows clean TDD progression (test → feat → refactor)
