# Monitor y Auditor de Sitios Web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete website monitoring and auditing platform using Nuxt 3 and Hono, featuring multi-role authentication (Clients and 1 Administrator), full-featured audit engine (SEO, Performance, Security, Domain, Tech stack, History), actionable prioritized Action Plan generator, and an elegant Light Mode dashboard.

**Architecture:** A unified fullstack Nuxt 3 application where Hono powers the REST API in `server/api/[...].ts` over SQLite/Cloudflare D1 with Drizzle ORM. Audits run server-side via parallel HTTP, DNS, SSL and HTML collectors, calculating weighted category scores and synthesizing prioritized action plans.

**Tech Stack:** Nuxt 3, Vue 3, Hono, Drizzle ORM, SQLite (`better-sqlite3` / Cloudflare D1 ready), Tailwind CSS, Lucide icons, Cheerio, Zod, bcryptjs, jsonwebtoken, Vitest.

**Spec:** [docs/superpowers/specs/2026-09-06-website-audit-platform-design.md](file:///Users/admin/Documents/monitordesitiosweb/docs/superpowers/specs/2026-09-06-website-audit-platform-design.md)

## Global Constraints
- Target platform: Node.js (v18+) with full compatibility for Cloudflare Pages / Workers + D1.
- Database: SQLite via Drizzle ORM with zero external database server requirements.
- Theme: Exclusively Light Mode (Modo Claro) with high-contrast slate/blue/emerald palette.
- Single command development: `npm run dev`.
- Auto-seed default Administrator account (`admin@monitor.local` / `Admin123!*`) if no admin exists.

---

### Task 1: Project Scaffolding & Base Dependencies

**Files:**
- Create: `package.json`
- Create: `nuxt.config.ts`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `.env`
- Create: `.gitignore`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: Base project structure runnable with `npm run dev` and testable with `npx vitest run`.

- [ ] **Step 1: Create `package.json` with Nuxt 3, Hono, Drizzle, Tailwind, and audit dependencies**
- [ ] **Step 2: Install dependencies via `npm install`**
- [ ] **Step 3: Configure `nuxt.config.ts` with Nitro server engine, Tailwind CSS, and runtime config**
- [ ] **Step 4: Create `.env.example` and `.env` with default secrets and SQLite path**
- [ ] **Step 5: Configure `vitest.config.ts` for automated testing**
- [ ] **Step 6: Run `npx vitest run` to verify test harness works**
- [ ] **Step 7: Commit scaffolding**

---

### Task 2: Database Layer with Drizzle ORM (SQLite / D1)

**Files:**
- Create: `server/db/schema.ts`
- Create: `server/db/index.ts`
- Create: `server/db/migrate.ts`
- Create: `server/db/seed.ts`
- Create: `tests/db.test.ts`

**Interfaces:**
- Produces:
  - `db`: Drizzle ORM client instance connected to SQLite
  - `users`, `audits`, `auditDetails`, `systemSettings` schemas
  - `ensureAdminSeeded()`: Auto-creates initial admin if none exists

- [ ] **Step 1: Write test for database operations and schema constraints in `tests/db.test.ts`**
- [ ] **Step 2: Run test to verify it fails** (`npx vitest run tests/db.test.ts`)
- [ ] **Step 3: Define relational schema in `server/db/schema.ts`**
- [ ] **Step 4: Implement DB connection and auto-table creation in `server/db/index.ts`**
- [ ] **Step 5: Implement admin auto-seeding routine in `server/db/seed.ts`**
- [ ] **Step 6: Run `npx vitest run tests/db.test.ts` to verify all tests pass**
- [ ] **Step 7: Commit database layer**

---

### Task 3: Hono Backend Server & Authentication Module

**Files:**
- Create: `server/api/[...].ts`
- Create: `server/utils/auth.ts`
- Create: `server/middleware/auth.ts`
- Create: `server/routes/auth.ts`
- Create: `tests/auth.test.ts`

**Interfaces:**
- Consumes: `db`, `users` from Task 2
- Produces:
  - Hono app mounted on `/api`
  - `/api/auth/register` (POST)
  - `/api/auth/login` (POST)
  - `/api/auth/logout` (POST)
  - `/api/auth/me` (GET)
  - `requireAuth`, `requireAdmin` middlewares

- [ ] **Step 1: Write failing integration tests for registration, login, JWT cookies, and role access in `tests/auth.test.ts`**
- [ ] **Step 2: Run test to verify it fails** (`npx vitest run tests/auth.test.ts`)
- [ ] **Step 3: Implement JWT sign/verify and bcrypt password hashing helpers in `server/utils/auth.ts`**
- [ ] **Step 4: Implement Hono auth middlewares (`authMiddleware`, `requireAuth`, `requireAdmin`)**
- [ ] **Step 5: Implement auth routes in `server/routes/auth.ts`**
- [ ] **Step 6: Mount Hono application in Nuxt's Nitro handler `server/api/[...].ts`**
- [ ] **Step 7: Run `npx vitest run tests/auth.test.ts` and ensure all tests pass**
- [ ] **Step 8: Commit authentication module**

---

### Task 4: Audit Engine & Action Plan Generator

**Files:**
- Create: `server/services/auditor/types.ts`
- Create: `server/services/auditor/fetchTarget.ts`
- Create: `server/services/auditor/seoAuditor.ts`
- Create: `server/services/auditor/performanceAuditor.ts`
- Create: `server/services/auditor/securityAuditor.ts`
- Create: `server/services/auditor/domainAuditor.ts`
- Create: `server/services/auditor/techAuditor.ts`
- Create: `server/services/auditor/actionPlanGenerator.ts`
- Create: `server/services/auditor/index.ts`
- Create: `tests/auditor.test.ts`

**Interfaces:**
- Produces:
  - `runAudit(targetUrl: string, options?: { pageSpeedApiKey?: string }): Promise<AuditResult>`
  - `generateActionPlan(findings: ModuleFindings): ActionPlanItem[]`

- [ ] **Step 1: Write tests for audit calculation, score weighting, and action plan rules in `tests/auditor.test.ts`**
- [ ] **Step 2: Run test to verify it fails** (`npx vitest run tests/auditor.test.ts`)
- [ ] **Step 3: Define TypeScript data contracts in `server/services/auditor/types.ts`**
- [ ] **Step 4: Implement network fetcher with timing and header capture in `fetchTarget.ts`**
- [ ] **Step 5: Implement `seoAuditor.ts` with DOM analysis (Cheerio)**
- [ ] **Step 6: Implement `performanceAuditor.ts` (TTFB, compression, asset count, cache headers, optional PageSpeed)**
- [ ] **Step 7: Implement `securityAuditor.ts` (SSL certificate check, security headers, mixed content)**
- [ ] **Step 8: Implement `domainAuditor.ts` (DNS records resolution via Node `dns.promises`)**
- [ ] **Step 9: Implement `techAuditor.ts` (CMS, servers, frameworks, analytics, CDN signatures)**
- [ ] **Step 10: Implement `actionPlanGenerator.ts` (prioritized recommendations, severity, impact, effort, steps)**
- [ ] **Step 11: Orchestrate modules in `server/services/auditor/index.ts`**
- [ ] **Step 12: Run `npx vitest run tests/auditor.test.ts` and verify all tests pass**
- [ ] **Step 13: Commit audit engine**

---

### Task 5: Hono Audit & Admin API Endpoints

**Files:**
- Create: `server/routes/audits.ts`
- Create: `server/routes/admin.ts`
- Modify: `server/api/[...].ts`
- Create: `tests/api-audits.test.ts`

**Interfaces:**
- Consumes: `runAudit` from Task 4, `db` from Task 2, `requireAuth`, `requireAdmin` from Task 3
- Produces:
  - `POST /api/audits/scan`
  - `GET /api/audits` (client sees own, admin sees all)
  - `GET /api/audits/:id`
  - `DELETE /api/audits/:id`
  - `GET /api/audits/history/:domain`
  - `GET /api/admin/stats`
  - `GET /api/admin/users`
  - `DELETE /api/admin/users/:id`
  - `GET /api/admin/settings` & `PUT /api/admin/settings`

- [ ] **Step 1: Write integration tests for audit scanning and admin routes in `tests/api-audits.test.ts`**
- [ ] **Step 2: Run test to verify it fails** (`npx vitest run tests/api-audits.test.ts`)
- [ ] **Step 3: Implement audit endpoints in `server/routes/audits.ts`**
- [ ] **Step 4: Implement admin management endpoints in `server/routes/admin.ts`**
- [ ] **Step 5: Register routes in Hono app (`server/api/[...].ts`)**
- [ ] **Step 6: Run `npx vitest run tests/api-audits.test.ts` to verify full endpoint coverage**
- [ ] **Step 7: Commit audit & admin API routes**

---

### Task 6: Nuxt Frontend Foundation, Modo Claro & Composables

**Files:**
- Create: `assets/css/main.css`
- Create: `tailwind.config.js`
- Create: `components/Navbar.vue`
- Create: `components/ScoreGauge.vue`
- Create: `components/StatusBadge.vue`
- Create: `components/Modal.vue`
- Create: `composables/useAuth.ts`
- Create: `composables/useAudits.ts`
- Create: `middleware/auth.ts`
- Create: `middleware/admin.ts`
- Create: `app.vue`

**Interfaces:**
- Produces:
  - Light mode CSS theme system
  - `useAuth()` reactive store (user, role, login, register, logout)
  - `useAudits()` reactive store (scan, list, details, delete, export)
  - Reusable visual components: `ScoreGauge`, `Navbar`, `StatusBadge`

- [ ] **Step 1: Configure Tailwind CSS and Light Mode variables in `tailwind.config.js` and `assets/css/main.css`**
- [ ] **Step 2: Implement `useAuth.ts` composable with session sync**
- [ ] **Step 3: Implement `useAudits.ts` composable for scans and reports**
- [ ] **Step 4: Implement route middlewares `middleware/auth.ts` and `middleware/admin.ts`**
- [ ] **Step 5: Create reusable Light Mode components (`Navbar.vue`, `ScoreGauge.vue`, `StatusBadge.vue`)**
- [ ] **Step 6: Create root layout in `app.vue`**
- [ ] **Step 7: Commit frontend foundation**

---

### Task 7: Landing Page & Authentication Views

**Files:**
- Create: `pages/index.vue`
- Create: `pages/login.vue`
- Create: `pages/register.vue`

**Interfaces:**
- Consumes: `useAuth` from Task 6
- Produces:
  - Responsive landing page showcasing the auditor capabilities
  - Login page with instant role redirection (admin -> admin tab, client -> client dashboard)
  - Registration page for new clients

- [ ] **Step 1: Build Light Mode Landing Page in `pages/index.vue` with feature hero, live demo preview, and CTAs**
- [ ] **Step 2: Build `pages/login.vue` with form validation, error banners, and auto-redirect**
- [ ] **Step 3: Build `pages/register.vue` with instant validation and registration**
- [ ] **Step 4: Commit landing and auth pages**

---

### Task 8: Interactive Dashboard (Client & Admin)

**Files:**
- Create: `pages/dashboard.vue`
- Create: `components/ScanBar.vue`
- Create: `components/AuditHistoryTable.vue`
- Create: `components/AdminUsersTable.vue`
- Create: `components/AdminStatsCards.vue`

**Interfaces:**
- Consumes: `useAuth`, `useAudits` from Task 6
- Produces:
  - Universal interactive URL scan bar with step-by-step progress feedback
  - Client Dashboard: personalized recent scans, average score, action shortcuts
  - Admin Dashboard: system KPI cards, user management, global audit registry, system settings

- [ ] **Step 1: Build `ScanBar.vue` with live progress animations during audit execution**
- [ ] **Step 2: Build `AuditHistoryTable.vue` with domain search, score badges, and action buttons**
- [ ] **Step 3: Build `AdminStatsCards.vue` and `AdminUsersTable.vue` for system oversight**
- [ ] **Step 4: Assemble `pages/dashboard.vue` with role-aware tabbed navigation**
- [ ] **Step 5: Commit dashboard views**

---

### Task 9: Detailed Audit Report & Action Plan Page

**Files:**
- Create: `pages/audits/[id].vue`
- Create: `pages/audits/history/[domain].vue`
- Create: `components/report/ReportHeader.vue`
- Create: `components/report/SeoTab.vue`
- Create: `components/report/PerformanceTab.vue`
- Create: `components/report/SecurityTab.vue`
- Create: `components/report/DomainTab.vue`
- Create: `components/report/TechTab.vue`
- Create: `components/report/ActionPlanTab.vue`
- Create: `components/report/SerpPreview.vue`

**Interfaces:**
- Consumes: `useAudits` from Task 6
- Produces:
  - Comprehensive multi-tab audit report view
  - Google SERP simulator
  - Interactive Action Plan checklist with impact/effort tags
  - Print/Export to Markdown / PDF feature
  - Domain evolution timeline view

- [ ] **Step 1: Build report header and summary gauges in `ReportHeader.vue`**
- [ ] **Step 2: Build `SeoTab.vue` with SERP preview and headings breakdown**
- [ ] **Step 3: Build `PerformanceTab.vue` with TTFB, load duration, and asset metrics**
- [ ] **Step 4: Build `SecurityTab.vue` with SSL health and security headers checklist**
- [ ] **Step 5: Build `DomainTab.vue` with DNS record copyable cards**
- [ ] **Step 6: Build `TechTab.vue` with categorized technology badges**
- [ ] **Step 7: Build `ActionPlanTab.vue` with prioritized tasks, checklist, and export action**
- [ ] **Step 8: Assemble `pages/audits/[id].vue`**
- [ ] **Step 9: Build `pages/audits/history/[domain].vue` for domain score trends**
- [ ] **Step 10: Commit detailed report & action plan views**

---

### Task 10: End-to-End Verification & Polishing

**Files:**
- Modify: any adjustments identified during full end-to-end verification
- Create: `README.md` with complete documentation, setup instructions, and architecture breakdown

**Interfaces:**
- Produces: Production-ready codebase, passes all tests and build checks.

- [ ] **Step 1: Run full test suite with `npx vitest run`**
- [ ] **Step 2: Run Nuxt production build (`npx nuxi build` or `npm run build`) to ensure zero type errors**
- [ ] **Step 3: Verify light mode styling, responsive breakpoints, and error states**
- [ ] **Step 4: Create comprehensive `README.md`**
- [ ] **Step 5: Final Git commit**
