# PROMPTS.md — AI-Assisted Development Log

## Tool Used

**Claude Code** (Anthropic) — CLI-based AI coding assistant  
Model: Claude Sonnet 4.6  
Session date: 2026-05-24  
Project: Salary Management Tool — Incubyte Software Craftsperson Assessment

---

## How AI Was Used

Claude Code was used as a **pair programmer** throughout the scaffold phase.
All architectural decisions, file contents, and commit messages were reviewed before
acceptance. The TDD discipline (test-first) will continue to be enforced in all
subsequent phases, with or without AI assistance.

Claude Code does **not** push code — every commit is reviewed by the developer.
The AI generates candidates; the developer accepts, modifies, or rejects them.

---

## Prompts Used (Chronological)

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
- `backend/package.json` with full dependency list and npm scripts (`dev`, `build`, `start`, `test`, `test:watch`)
- `backend/tsconfig.json` with strict, experimentalDecorators, emitDecoratorMetadata, ES2022
- `backend/src/config/database.ts` — multi-env Sequelize config (test=SQLite, dev=pg env vars, prod=DATABASE_URL+SSL)
- `backend/src/index.ts` — Express app with helmet, cors, morgan, health check, 404 handler, global error handler
- `backend/.env.example`
- `backend/.gitignore`
- All empty `src/` subdirectories

**Commit:** `chore: scaffold backend project structure`

---

### Prompt 2 — Frontend Scaffold (Plan Mode)

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
- `frontend/postcss.config.js` — Tailwind + autoprefixer pipeline
- `frontend/components.json` — shadcn/ui CLI config
- `frontend/src/index.css` — Tailwind directives + CSS variables (light + dark)
- `frontend/src/lib/utils.ts` — `cn()` helper
- `frontend/src/components/ui/button.tsx` — shadcn Button with CVA variants
- `frontend/src/components/Navbar.tsx` — NavLink-based nav with active-state styling
- `frontend/src/pages/EmployeesPage.tsx` — placeholder
- `frontend/src/pages/InsightsPage.tsx` — placeholder
- `frontend/src/App.tsx` — BrowserRouter + Routes + redirect `/` → `/employees`
- `frontend/src/main.tsx` — QueryClientProvider (5-min staleTime) wrapping App

**Issues resolved during execution:**
- `npm create vite@latest` created a vanilla TypeScript project instead of React — React and `@vitejs/plugin-react` were installed manually
- TypeScript 6 deprecated `baseUrl` — fixed by adding `"ignoreDeprecations": "6.0"` to tsconfig
- `JSX.Element` return type annotation not available without explicit import in TS6+strict — removed explicit return type annotations (inferred by compiler)
- shadcn CLI wrote Button to a literal `@/` directory before `vite.config.ts` was in place — Button was rewritten manually with correct CVA implementation

**Commit:** `chore: scaffold frontend with Vite, React, TypeScript, Tailwind, shadcn/ui, react-router-dom`

---

### Prompt 3 — Documentation

```
Read CLAUDE.md fully.

Create the /docs folder with these 4 files:

1. PLANNING.md — explain the problem breakdown, phases planned, user persona analysis
2. ARCHITECTURE.md — text-based diagram showing frontend → backend → postgres,
   explain each layer
3. TRADEOFFS.md — explain: Sequelize vs Prisma, PostgreSQL vs SQLite, shadcn/ui
   choice, pagination decision, bulkCreate for seeding
4. PROMPTS.md — document that AI (Claude Code) was used, list the prompts used so far

Commit: "docs: add planning, architecture, tradeoffs and prompts artifacts"
```

**What was generated:**  
This file, plus `PLANNING.md`, `ARCHITECTURE.md`, and `TRADEOFFS.md`.

**Commit:** `docs: add planning, architecture, tradeoffs and prompts artifacts`

---

## Prompts Planned for Future Phases

These prompts will be logged here as they are executed.

### Phase 1 — Employee Model + Migration (TDD)
```
[planned] Write the failing test for the Employee model first.
Then implement the model. Then run migrations.
Follow strict TDD: test commit → feat commit → refactor commit.
```

### Phase 1 — Employee CRUD Endpoints (TDD)
```
[planned] Write failing integration tests for each endpoint using supertest.
Implement routes and services until all tests pass.
```

### Phase 2 — Frontend Employee Table
```
[planned] Build the paginated employee table using shadcn Table.
Connect to GET /api/employees via TanStack Query.
Add Create/Edit/Delete functionality.
```

### Phase 3 — Insights API + Frontend
```
[planned] Implement InsightsService with Sequelize aggregations.
Build InsightsPage with cards and metrics.
```

### Phase 4 — Seed Script
```
[planned] Write seed/seed.ts using first_names.txt + last_names.txt.
bulkCreate in batches of 500. Log time. Target < 30 seconds.
```

---

## Notes on AI-Assisted Development

1. **AI generates, developer verifies.** Every file was reviewed before commit.
2. **Prompt specificity matters.** Vague prompts produce vague scaffolds; the prompts above were deliberately specific about file names, package names, and constraints.
3. **Errors are expected.** The Vite template issue and TypeScript 6 deprecation were caught and corrected during execution — AI-assisted development is iterative, not magical.
4. **TDD is not automated.** The test-first discipline is enforced by the developer, not the AI. The AI can generate tests and implementations, but the developer must ensure tests fail first before implementation is accepted.
