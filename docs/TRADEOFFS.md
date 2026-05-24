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
Prisma's generated client is more type-safe end-to-end (no `any` leaking through query results). With Sequelize, we must be disciplined about using `attributes` to select only needed columns and typing service return values explicitly.

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
Using PostgreSQL in production is non-negotiable for a system managing salary data — currency values must be exact (DECIMAL, not REAL), and concurrent HR users need proper MVCC isolation. However, running a PostgreSQL server in CI and local test environments adds friction. SQLite in-memory eliminates that friction completely: tests boot in milliseconds, run in isolation, and need no external service.

**Trade-off accepted:**  
SQLite does not support ENUM natively, so the `employmentType` ENUM behaves differently in tests (stored as TEXT). We mitigate this by validating `employmentType` at the service layer, making the test coverage meaningful despite the dialect difference. Any PostgreSQL-specific behavior (e.g., `ILIKE` for case-insensitive search) must be tested in a real PostgreSQL environment before production deployment.

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
| TypeScript | Full TypeScript | Full TypeScript | Full TypeScript |
| Learning curve | Low if you know Tailwind | Medium | Medium |

**Why shadcn/ui won:**  
shadcn/ui components are **copied into your repository as source files** — not installed as a black-box dependency. This means:
1. No version lock-in or breaking upgrade surprises
2. Full customization without fighting against a theme system
3. Tree-shaking is perfect — unused components don't ship
4. Radix UI primitives give us accessible Dialog, DropdownMenu, etc. for free

For an HR tool with a custom brand, shadcn/ui's neutrality is a feature, not a limitation.

**Trade-off accepted:**  
shadcn/ui ships fewer complex components out of the box (no DataGrid with 200 features). We will need to build the paginated employee table using shadcn's `Table` primitives + TanStack Query pagination logic rather than dropping in a pre-built DataGrid. This takes more code but gives us exactly what we need without fighting defaults.

---

## 4. Pagination: Offset vs Cursor

### Chosen: Offset pagination (`?page=1&limit=20`)

| Factor | Offset Pagination | Cursor Pagination |
|---|---|---|
| Implementation | Simple: `LIMIT n OFFSET (page-1)*n` | Complex: `WHERE id > :cursor ORDER BY id` |
| UI compatibility | Page number buttons ("Page 3 of 500") | Next/prev only — no page jump |
| Predictable | Yes — page 3 always starts at row 41 | No — cursor changes with inserts |
| Performance at scale | Degrades at high offsets (PostgreSQL scans rows to skip) | O(1) — cursor index seek |
| Use case fit | HR tool: jump to "page 50", search by filter | Feed/timeline: infinite scroll |

**Why offset pagination won:**  
HR Managers need to jump to specific pages ("show me page 20 out of 500"). Cursor-based pagination cannot support this. With 10,000 employees and a `LIMIT 20`, the maximum offset is 9,980 — well within the range where PostgreSQL offset performance is acceptable (especially with indexes on country/department for filtered queries).

**Trade-off accepted:**  
At very high offsets (e.g., page 499 of 500), PostgreSQL must scan and discard 9,980 rows before returning 20. For this dataset size (10k rows), this is imperceptible. If the dataset grew to millions of rows with heavy filter usage, we would revisit cursor pagination for filtered views.

---

## 5. Seeding: bulkCreate in Batches vs Raw SQL COPY

### Chosen: Sequelize `bulkCreate` in 500-row chunks

| Factor | bulkCreate (batched) | Raw SQL COPY / pg COPY FROM |
|---|---|---|
| Type safety | Full — Employee model validates each record | None — raw strings |
| Hooks/validators | Run on each row | Bypassed |
| Implementation complexity | Low | High — requires CSV generation |
| Performance | ~500 rows/batch, ~20 batches for 10k | Fastest possible (~1 second) |
| Cross-DB compatibility | Works on SQLite and PostgreSQL | PostgreSQL only |
| Error reporting | Per-row validation errors visible | Bulk failure, hard to debug |

**Why bulkCreate won:**  
The CLAUDE.md specification explicitly requires `bulkCreate` with `{ ignoreDuplicates: true }`. Beyond the spec, batching in 500-row chunks:
1. Stays below PostgreSQL's 65,535 parameter limit (500 rows × ~10 columns = 5,000 params)
2. Keeps heap memory bounded — no 10k-object array in RAM at once
3. Gives visible progress logging per batch

**Trade-off accepted:**  
Raw `COPY FROM` would seed in under 2 seconds. The batched `bulkCreate` approach takes 10–30 seconds for 10k rows. This is an acceptable cost for the type safety and simplicity gained — the seed script is a one-time or occasional operation, not on the hot path.

---

## 6. TDD: Test-First vs Test-After

### Chosen: Strict TDD (test first, always)

**Why:**  
The CLAUDE.md spec mandates this. Beyond compliance, TDD for a CRUD + insights backend forces us to specify the contract (input shape, output shape, error conditions) before writing any implementation. This is especially valuable for the insights queries, where it's easy to accidentally return incorrect aggregations without a test to catch it.

**Trade-off accepted:**  
TDD takes longer upfront. For a simple CRUD endpoint, writing the test before the route handler doubles the perceived setup time. The payback comes during refactoring: with full test coverage, changing the Sequelize query internals does not require manual re-testing of every endpoint.
