# Internal Line Quality Portal

A client-side quality analytics dashboard for tracking **rejection**, **rework**, and **FQC fallout**
on production lines. Data is imported from Excel workbooks and visualized across six views.

> **VE Commercial Vehicles Limited** — Internal Line Quality Portal

---

## Overview

The portal has no server-side data store. It ships empty and populates entirely from an Excel file
you upload in the browser. Nothing is sent anywhere; parsing and analysis both happen on the client.

**Workflow:** open the portal → see the empty state → import a workbook → explore the dashboards.

## Features

- **Excel import** — multi-sheet workbooks, automatic header-row detection, flexible column
  matching (e.g. `part no.`, `part no`, `part number` all resolve to the same field)
- **Six views** — Dashboard, Analytics, Rejection, Rework, FQC Fallout, Reports
- **Filtering** — by month, machine/cell/line, shift, and free-text search
- **Charts** — trend, grouped bar, horizontal ranked, Pareto, comparison
- **KPI summary** — rejection/rework counts, quantities, and cost of poor quality
- **CSV export** — with spreadsheet formula-injection protection
- **Empty state** — every page renders a clear no-data state until a workbook is imported

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16.3.5 (App Router, Turbopack) |
| UI | React 19.2.8, Tailwind CSS 4 |
| Charts | Recharts 3 |
| Icons | lucide-react |
| Spreadsheet parsing | SheetJS (`npm:@e965/xlsx@0.20.3`) |
| Language | TypeScript 5 |
| Compiler | React Compiler enabled |

React Compiler is on (`reactCompiler: true` in `next.config.ts`), so avoid manual memoization
unless profiling shows a specific need. It runs through the native Rust port
(`experimental.turbopackRustReactCompiler`), which is why `babel-plugin-react-compiler` is not
a dependency.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The portal loads with no data — click
**Import Excel File** and select a workbook to begin.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build — writes the static site to `out/` |
| `npm run lint` | Run ESLint |

`npm start` is intentionally absent: `next start` needs a Node server, and this project
builds to static files instead. Use `npm run dev` locally, or serve `out/` with any static
file server.

## Deployment

The app builds to a **static site** (`output: 'export'`), so it runs anywhere that can serve
files — no Node server, no serverless functions, no per-user compute.

### Cloudflare Pages

1. Connect the Git repo and create a Pages project.
2. Set the build configuration:

   | Setting | Value |
   | --- | --- |
   | Framework preset | Next.js (Static HTML Export) |
   | Build command | `npm run build` |
   | Build output directory | `out` |
   | Node version | `22` (env var `NODE_VERSION`) |

3. Deploy.

Next.js 16 requires Node 20.9+ and Cloudflare's default is older, so set `NODE_VERSION`
explicitly or the build fails before it starts.

**Why `trailingSlash: true`:** with static export, each route is emitted as
`rejection/index.html` instead of `rejection.html`. Static hosts serve a directory's
`index.html` but 404 on a bare `/rejection`, which breaks hard refreshes and bookmarks.

### Any other static host

`npm run build` produces `out/` — upload it to Netlify, GitHub Pages, S3, or behind nginx.

### What this rules out

Static export means no request-time server code: no API routes, no middleware, no server
actions, no ISR, and no `next/image` optimisation. None of those are used today. If you later
need shared data across users, that requires a backend and a host with a runtime — at which
point drop `output: 'export'` and deploy to a Node-capable platform instead.

## Project Structure

```
src/
├── app/                      # App Router pages
│   ├── page.tsx              # Dashboard
│   ├── analytics/            # Cross-cutting analytics
│   ├── rejection/            # Rejection analysis
│   ├── rework/               # Rework analysis
│   ├── fqc-fallout/          # FQC fallout analysis
│   ├── reports/              # Reports + CSV export
│   └── settings/             # App settings, clear imported data
├── components/
│   ├── charts/               # Chart components + lazy barrel (index.tsx)
│   ├── dashboard/            # Summary sections
│   ├── filters/              # Filter controls
│   ├── layout/               # Header, Sidebar
│   ├── tables/               # QualityTable
│   └── ui/                   # Card, KPICard, EmptyState, NoDataState, modal, pagination
├── context/
│   └── QualityDataContext.tsx  # Imported data + derived state
├── lib/
│   ├── calculations/         # KPI and aggregation logic
│   ├── constants/            # Company name, colors, column mappings
│   ├── hooks/                # useQualityDerivations, useDebouncedValue
│   ├── services/             # Excel parsing and normalization
│   └── utils/                # Formatters, shared record filters
└── types/
    └── quality.ts            # Shared domain types
```

The `@/*` path alias maps to `./src/*`.

## Data Model

Three quality types, stored in two shapes:

| Type | Stored as | Description |
| --- | --- | --- |
| `REJECTION` | `QualityRecord` | Parts rejected during production |
| `REWORK` | `QualityRecord` | Parts requiring rework |
| `FQC_FALLOUT` | `FQCRecord` | Parts failing final quality check |

FQC fallout is carried **only** by `FQCRecord`. A workbook row is never emitted as both a
quality record and an FQC record, which is what keeps FQC quantities from being counted twice
across the trend, line, part, and customer aggregations.

Core interfaces live in `src/types/quality.ts` — `QualityRecord`, `FQCRecord`, `KPISummary`,
and the aggregation result types (`DailyTrendItem`, `ParetoItem`, `MachineRankingItem`, etc.).

Fields the source workbooks do not record are left empty rather than guessed: lot size and
fallout rate are optional on `FQCRecord` and render as `N/A`, and `cell` falls back to the
sheet-derived line when the free-text `Oprn.` column holds no usable value.

## Import Pipeline

All parsing is centralized in `src/lib/services/excelParser.ts`.

1. **Validate** — file size, row count, and sheet count are bounded before parsing
2. **Parse** — each sheet is scanned for a header row (first 12 rows)
3. **Map** — headers are matched against flexible aliases, so minor naming differences are tolerated
4. **Normalize** — dates handled in multiple formats (`.`, `/`, ISO, Excel serial numbers)
5. **Filter** — summary rows (`total`, `grand total`) and empty rows are dropped

Parsing runs on a **Web Worker** so the UI never freezes mid-import. `excelParser.ts` is the pure
parsing module; `parserWorker.ts` wraps it for the worker thread, and `excelImport.ts` decides
where to run it — on the worker, falling back to the main thread if workers are unavailable,
blocked by CSP, or fail to start. The file buffer is transferred rather than copied.

Column resolution is **tiered** — exact match first, then prefix, then substring — and each
column can only be claimed once. This matters for workbooks that carry both `cost per piece`
and `total cost`: a plain substring search resolves both to the former and understates the
cost of poor quality.

Rows that cannot be placed in time or carry no quantity are skipped and reported as a
`skippedRows` count in the import summary, rather than being stamped with today's date or
given a quantity of 1.

**Exclusion rule.** Records and sheets whose fields mention an excluded term (see
`EXCLUDED_TERMS` in `src/lib/utils/qualityFilters.ts`) are dropped at import and again at
aggregation, from one shared predicate so the two layers cannot drift apart.

**Limits** (exceeding any raises a typed `ExcelImportError`):

| Limit | Value |
| --- | --- |
| Max upload size | 10 MB |
| Max rows per sheet | 20,000 |
| Max sheets per workbook | 50 |

The parser is loaded on demand, not on first paint.

**Chart animation is off.** Every Recharts series sets `isAnimationActive={CHART_ANIMATION_ACTIVE}`
(`false`) from `src/components/charts/chartStyles.ts`. Recharts otherwise replays a 400 ms
animation on every data change, which on this dashboard dominates every filter interaction —
the aggregations themselves take ~1 ms.

## Architecture Notes

**Client-side only.** No auth, database, or server-side file I/O. Imported data lives in React
state and is **lost on page reload** — there is currently no persistence layer.

**Lazy-loaded charts.** All charts are loaded through `src/components/charts/index.tsx` using
`next/dynamic` with `ssr: false`. Import from that barrel, not from the individual chart files,
or you will pull Recharts back into the initial bundle.

**Type-only imports matter here.** The `xlsx` parser is kept off the critical path, and that
depends on `import type` being used for type-only symbols:

```ts
import type { ExcelImportResult } from '@/lib/services/excelParser';
```

Using a value import for a type will silently drag the whole parser into the first-paint bundle.

**Shared derivations.** Pages consume `useQualityDerivations()` rather than recomputing
aggregations individually.

**Filter changes are deferred, not debounced.** `useQualityDerivations` passes the filter
object through `useDeferredValue` before it reaches the aggregations. This is deliberate and
distinct from the 250 ms search debounce: it lets the filter control repaint immediately while
the charts catch up at transition priority, which is what keeps INP down. Removing it makes
every dropdown change rebuild all seven charts' SVG before the browser can paint.

## Security

- **SheetJS patched** — `xlsx@0.18.5` carried CVE-2023-30533 (prototype pollution) and
  CVE-2024-22363 (ReDoS). Replaced with `npm:@e965/xlsx@0.20.3`. `npm audit` reports clean.
- **Formula injection blocked** — exported CSV cells beginning with `=`, `+`, `-`, `@`, tab, or CR
  are prefixed with an apostrophe so spreadsheet apps treat them as text.
- **Bounded parsing** — upload size, row count, and sheet count are capped (see above).
- **No XSS sinks** — no `dangerouslySetInnerHTML`, `innerHTML`, or `eval`. Excel-derived strings
  render through React, which escapes by default.

## Development Notes

This project uses a Next.js version with breaking changes relative to older releases. Check
`node_modules/next/dist/docs/` before writing framework code, and see `AGENTS.md` for the
project's agent instructions.

## Verification

```bash
npm audit          # 0 vulnerabilities
npx tsc --noEmit   # 0 errors
npm run lint       # 0 errors, 0 warnings
npm run build      # 10/10 pages generated
```

The same gate runs in CI on demand. `.github/workflows/manual-test.yml` is
`workflow_dispatch`-only — no `push`, `pull_request`, or `schedule` trigger — so it never
runs by itself. Start it from **Actions → Manual Test → Run workflow**, or:

```bash
gh workflow run manual-test.yml
```

It installs with `npm ci`, audits, type-checks, lints, builds, then serves the static export
over HTTP and requests every route (a route that returns 200 without rendering fails the run).
Optionally it also boots `next dev` and repeats the route walk against the dev server.

| Input | Default | Effect |
| --- | --- | --- |
| `node_version` | `22` | Node version to run the checks with |
| `strict_audit` | off | Fail on any audit finding instead of only high/critical |
| `run_dev_smoke` | on | Also boot `next dev` and request every route |
