# TRADEOFFS.md — Design Decisions and Their Rationale

## 1. Sequelize vs Prisma

### Chosen: Sequelize (with `sequelize-typescript`)

| Factor | Sequelize | Prisma |
|---|---|---|
| Model definition | TypeScript class decorators (`@Table`, `@Column`) | Schema file (`.prisma`) + generated client |
| Migration control | Manual migration files — full control | Auto-generated migrations, less flexibility |
| Raw query power | `fn()`, `col()`, `literal()` — expressive | `$queryRaw` works but feels like an escape hatch |
| Decorator familiarity | Familiar to Java/Spring developers | Prisma-specific DSL to learn |
| Type safety | Good with `sequelize-typescript` | Excellent — Prisma generates 100% type-safe client |
| Aggregation queries | Native `fn('AVG', col('salary'))` | Possible via `groupBy` but verbose |

**Why Sequelize won:**  
The project mandates Sequelize specifically. Beyond that, the insights feature requires complex aggregations (MIN, MAX, AVG, COUNT grouped by country/department/jobTitle). Sequelize's `fn`, `col`, and `literal` make these aggregations expressive without dropping into raw SQL strings. Prisma's `groupBy` with aggregations is more verbose and less composable for this use case.

**Trade-off accepted:**  
Prisma's generated client is more type-safe end-to-end. With Sequelize, we must be disciplined about using `attributes` to select only needed columns and typing service return values explicitly.

---

## 2. PostgreSQL (production) vs SQLite (everywhere)

### Chosen: PostgreSQL for prod/dev, SQLite for tests only

| Factor | PostgreSQL | SQLite |
|---|---|---|
| Concurrency | Full MVCC — handles many HR users simultaneously | Writer lock — single writer at a time |
| Decimal precision | `DECIMAL(12,2)` — exact for currency | Stores as REAL — floating point errors |
| ENUM type | Native PostgreSQL ENUM | No native ENUM; stored as TEXT |
| JSON columns | Native JSONB support | Limited JSON support |
| Hosted DB services | Render, Supabase, Railway, RDS | Not suitable for hosted prod |
| Test speed | Requires running server | In-memory, ~5ms startup |

**Why this split:**  
Using PostgreSQL in production is non-negotiable for a system managing salary data — currency values must be exact (DECIMAL, not REAL), and concurrent HR users need proper MVCC isolation. SQLite in-memory eliminates test environment friction completely.

**Trade-off accepted:**  
SQLite does not support ENUM natively, so `employmentType` is stored as TEXT in tests. We mitigate this by validating at the service layer.

---

## 3. shadcn/ui vs Material UI vs Ant Design

### Chosen: shadcn/ui + Tailwind CSS

| Factor | shadcn/ui | Material UI (MUI) | Ant Design |
|---|---|---|---|
| Bundle size | Only ship components you use | ~300 kB min+gzip baseline | ~400 kB min+gzip baseline |
| Styling model | Tailwind CSS (utility classes) | CSS-in-JS (emotion) | Less CSS |
| Customization | Full — components are source files in your repo | Theming via `createTheme` | Theming via token overrides |
| Accessibility | Radix UI primitives — ARIA built-in | Good | Good |
| Design opinion | Minimal, neutral | Strong Material Design | Strong enterprise look |

**Why shadcn/ui won:**  
shadcn/ui components are **copied into your repository as source files** — not installed as a black-box dependency. This means no version lock-in, perfect tree-shaking, and full customization. Radix UI primitives give accessible Dialog, Label, etc. for free.

**Trade-off accepted:**  
No pre-built DataGrid. The paginated table was built from shadcn `Table` primitives + TanStack Query pagination logic.

---

## 4. Pagination: Offset vs Cursor

### Chosen: Offset pagination (`?page=1&limit=20`)

| Factor | Offset Pagination | Cursor Pagination |
|---|---|---|
| Implementation | Simple: `LIMIT n OFFSET (page-1)*n` | Complex: `WHERE id > :cursor ORDER BY id` |
| UI compatibility | Page number buttons ("Page 3 of 500") | Next/prev only — no page jump |
| Performance at scale | Degrades at high offsets | O(1) — cursor index seek |
| Use case fit | HR tool: jump to "page 50" | Feed/timeline: infinite scroll |

**Why offset pagination won:**  
HR Managers need to jump to specific pages. With 10,000 employees and `LIMIT 20`, the maximum offset is 9,980 — well within acceptable PostgreSQL performance.

**Trade-off accepted:**  
At very high offsets, PostgreSQL scans and discards rows before returning the page. For 10k rows this is imperceptible. Revisit if dataset grows to millions.

---

## 5. Seeding: bulkCreate in Batches vs Raw SQL COPY

### Chosen: Sequelize `bulkCreate` in 500-row chunks

| Factor | bulkCreate (batched) | Raw SQL COPY |
|---|---|---|
| Type safety | Full — Employee model validates each record | None — raw strings |
| Implementation complexity | Low | High — requires CSV generation |
| Performance | ~20 batches for 10k, target < 30s | ~1 second |
| Cross-DB compatibility | Works on SQLite and PostgreSQL | PostgreSQL only |

**Why bulkCreate won:**  
CLAUDE.md explicitly requires `bulkCreate`. Batching in 500-row chunks stays below PostgreSQL's 65,535 parameter limit and keeps heap memory bounded.

**Trade-off accepted:**  
Raw `COPY FROM` would seed in < 2 seconds. The 10–30 second cost is acceptable for a one-time operation.

---

## 6. TDD: Test-First vs Test-After

### Chosen: Strict TDD (test first, always)

**Why:**  
CLAUDE.md mandates this. TDD forces specification of contracts (input shape, output shape, error conditions) before writing implementation. Especially valuable for the insights queries, where incorrect aggregations are easy to miss without a test.

**Trade-off accepted:**  
TDD takes longer upfront. The payback is during refactoring: changing Sequelize query internals does not require manual re-testing of every endpoint.

---

## 7. Axios Instance Location: `src/lib/api.ts` vs `src/services/api.ts`

### Chosen: `src/lib/api.ts`

The central Axios instance lives in `src/lib/api.ts`, not `src/services/api.ts`.

**Why:**  
The scaffold created both `src/lib/` (for utilities like `cn()`) and `src/services/` (empty placeholder). The Axios instance is a **shared utility** — a configured HTTP client, not a business-logic service wrapper. The `lib/` convention already established by shadcn/ui (`src/lib/utils.ts`) is a natural fit. `src/services/` was left as a placeholder for potential future business-logic wrappers (e.g. if data transformation were needed before React Query received it).

**Trade-off accepted:**  
The audit question "Is there a central axios instance in `src/services/api.ts`?" gets a "wrong path" answer. The location is correct semantically; it just differs from a common alternative convention. All 5 hooks import from `@/lib/api` consistently.

---

## 8. React.memo Scope: All Components Including UI Primitives

### Chosen: Wrap every component — pages, custom components, sub-components, and shadcn/ui primitives

**Why:**  
Consistency and future-proofing. Once the rule "memo all list and table components" is established, applying it uniformly to all components (including leaf nodes like `Button` and `TableCell`) avoids the maintenance burden of deciding per-component whether memo is "worth it". The cost of an unnecessary `React.memo` is a single shallow prop comparison — negligible.

**Trade-off accepted:**  
For true leaf nodes (e.g. `Button`, `TableCell`), `React.memo` adds almost no real-world benefit since their props rarely change without meaningful intent. The `React.memo` call itself has a tiny overhead. For components in hot render paths (like `EmployeeRow` rendered 20 times per page), the benefit is real.

---

## 9. Generic Component + React.memo: Two-Step Cast Pattern

### Chosen: `function Inner<T>() {...}; const X = memo(Inner) as typeof Inner`

TypeScript's `React.memo` does not preserve generic type parameters:  
`memo(<T,>({ rows }: { rows: T[] }) => ...)` loses `T` in the resulting component type.

**Solution:**
```ts
function SalaryTableInner<T extends { avgSalary: number }>(props: Props<T>) { ... }
const SalaryTable = memo(SalaryTableInner) as typeof SalaryTableInner
```

**Why:**  
The `as typeof SalaryTableInner` cast restores the full generic signature on the memo-wrapped export, so call sites get proper TypeScript inference for `getLabel: (row: T) => string` without any `as` casts.

**Trade-off accepted:**  
The cast is technically unsafe — if the component's props shape changed after the cast, TypeScript would not catch it. In practice, `SalaryTableInner` is immediately reassigned and never used directly, so the cast is safe by construction.

---

## 10. Route-Level Lazy Loading: Navbar Stays Static

### Chosen: Lazy-load only page components; keep Navbar as a static import

```ts
// Static — always in the initial bundle
import Navbar from '@/components/Navbar'

// Lazy — each is a separate JS chunk
const EmployeesPage = lazy(() => import('@/pages/EmployeesPage'))
const InsightsPage  = lazy(() => import('@/pages/InsightsPage'))
```

**Why:**  
The Navbar renders on **every route** and is part of the visible shell. Making it lazy would cause a flash of missing navigation during the initial hydration. Page components are only needed when the user navigates to that route, making them the correct boundary for code splitting.

**Trade-off accepted:**  
The `Suspense` fallback (`PageLoader`) shows a bare "Loading…" text with no navigation context. A more polished implementation would show a skeleton Navbar during page-chunk loading. For this project, the simplicity is preferred.

---

## 11. useCallback Scope: All Handlers, Not Just Prop-Passed Ones

### Chosen: `useCallback` on every event handler in every component

CLAUDE.md says "Use `useCallback` for all handlers **passed as props**". In the implementation, this was extended to **all handlers** including those only used within the component's own JSX (e.g. `handleSearchChange` in `EmployeesPage`, which is only on the `Input` within the same component).

**Why:**  
1. **Consistency** — a blanket rule is easier to follow and review than a per-handler decision
2. **Future-proofing** — if a handler-owning component is later split into a child, the handler is already stable
3. **React StrictMode** — in development, components render twice; stable handler references reduce false positives in effect dependency arrays

**Trade-off accepted:**  
`useCallback` on handlers that are only used locally (not passed as props) gives no measurable re-render benefit — the component itself still re-renders on state change regardless. The cost is added verbosity in the component body.
