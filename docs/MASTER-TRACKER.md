# Trucker's Routine Admin App — Master Implementation Tracker

> Single source of truth for tracking all implementation progress across all 6 phases.

---

## Overall Progress

| Phase | Description | Status | Files | Progress |
|-------|-------------|--------|-------|----------|
| 1 | [Project Setup & Foundation](#phase-1-project-setup--foundation) | Complete | 8 | ██████████ 100% |
| 2 | [Auth & Layout](#phase-2-auth--layout) | Complete | 12 | ██████████ 100% |
| 3 | [Reusable Components & Hooks](#phase-3-reusable-components--hooks) | Complete | 16 | ██████████ 100% |
| 4 | [Content Pages](#phase-4-content-pages) | Complete | 17 | ██████████ 100% |
| 5 | [Workouts & Users](#phase-5-workouts--users) | Complete | 7 | ██████████ 100% |
| 6 | [Settings](#phase-6-settings) | Not Started | 3 | ░░░░░░░░░░ 0% |
| — | **Total** | — | **63** | █████████░ **95%** |

---

## Phase 1: Project Setup & Foundation

📄 **Guide:** [PHASE-1-PROJECT-SETUP.md](./PHASE-1-PROJECT-SETUP.md)

| # | Task | File/Action | Status |
|---|------|-------------|--------|
| 1.1 | Initialize Next.js project | `npx create-next-app@latest .` | ✅ |
| 1.2 | Install core dependencies | `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, etc. | ✅ |
| 1.3 | Install shadcn/ui + components | `npx shadcn@latest init` + 28 components | ✅ |
| 1.4 | Configure Tailwind brand theme | `app/globals.css` (Tailwind v4 CSS-based config) | ✅ |
| 1.5 | Set up globals.css with CSS variables | `app/globals.css` | ✅ |
| 1.6 | Configure Montserrat font | `app/layout.tsx` | ✅ |
| 1.7 | Copy logo assets | `public/images/logo.png`, `logo-alt.png`, favicon | ✅ |
| 1.8 | Create environment files | `.env.local`, `.env.example` | ✅ |

**Verify:** `npm run dev` runs, page loads, font renders, logos display.

---

## Phase 2: Auth & Layout

📄 **Guide:** [PHASE-2-AUTH-AND-LAYOUT.md](./PHASE-2-AUTH-AND-LAYOUT.md)

| # | Task | File | Status |
|---|------|------|--------|
| 2.1 | TypeScript types for all API schemas | `lib/types.ts` | ✅ |
| 2.2 | API client with auto token refresh | `lib/api.ts` | ✅ |
| 2.3 | Zustand auth store | `lib/auth-store.ts` | ✅ |
| 2.4 | Route protection middleware | `middleware.ts` | ✅ |
| 2.5 | TanStack Query provider | `components/providers/query-provider.tsx` | ✅ |
| 2.6 | Auth provider (init on load) | `components/providers/auth-provider.tsx` | ✅ |
| 2.7 | Root layout with providers | `app/layout.tsx` (update) | ✅ |
| 2.8 | Login page | `app/login/page.tsx` | ✅ |
| 2.9 | Sidebar navigation | `components/layout/sidebar.tsx` | ✅ |
| 2.10 | Header with user dropdown | `components/layout/header.tsx` | ✅ |
| 2.11 | Dashboard layout (auth guard) | `app/(dashboard)/layout.tsx` | ✅ |
| 2.12 | Dashboard home placeholder | `app/(dashboard)/page.tsx` | ✅ |

**Verify:** Login works, session persists, sidebar navigates, logout works.

---

## Phase 3: Reusable Components & Hooks

📄 **Guide:** [PHASE-3-REUSABLE-COMPONENTS.md](./PHASE-3-REUSABLE-COMPONENTS.md)

### Shared Components

| # | Task | File | Status |
|---|------|------|--------|
| 3.1 | Constants (all dropdown options) | `lib/constants.ts` | ✅ |
| 3.2 | Data table (pagination, search, filters) | `components/data-table.tsx` | ✅ |
| 3.3 | Exercise picker (search, select, reorder) | `components/exercise-picker.tsx` | ✅ |
| 3.4 | Tag input (multi-select tags) | `components/tag-input.tsx` | ✅ |
| 3.5 | Confirm dialog (destructive actions) | `components/confirm-dialog.tsx` | ✅ |

### TanStack Query Hooks

| # | Task | File | Hooks Count | Status |
|---|------|------|-------------|--------|
| 3.6 | Blueprint hooks | `lib/hooks/use-blueprints.ts` | 9 hooks | ✅ |
| 3.7 | Exercise hooks | `lib/hooks/use-exercises.ts` | 6 hooks | ✅ |
| 3.8 | Tip hooks | `lib/hooks/use-tips.ts` | 15 hooks | ✅ |
| 3.9 | Preset Reset hooks | `lib/hooks/use-resets.ts` | 10 hooks | ✅ |
| 3.10 | Workout hooks | `lib/hooks/use-workouts.ts` | 10 hooks | ✅ |
| 3.11 | User hooks | `lib/hooks/use-users.ts` | 7 hooks | ✅ |
| 3.12 | Corporate hooks | `lib/hooks/use-corporate.ts` | 9 hooks | ✅ |
| 3.13 | Quote hooks | `lib/hooks/use-quotes.ts` | 5 hooks | ✅ |
| 3.14 | Pricing hooks | `lib/hooks/use-pricing.ts` | 5 hooks | ✅ |
| 3.15 | API Key hooks | `lib/hooks/use-api-keys.ts` | 3 hooks | ✅ |
| 3.16 | Help Center hooks | `lib/hooks/use-help-center.ts` | 7 hooks | ✅ |

**Verify:** Components render, hooks compile, no TypeScript errors.

---

## Phase 4: Content Pages

📄 **Guide:** [PHASE-4-CONTENT-PAGES.md](./PHASE-4-CONTENT-PAGES.md)

### Dashboard

| # | Task | File | Status |
|---|------|------|--------|
| 4.1 | Dashboard with stats + coverage | `app/(dashboard)/page.tsx` | ✅ |

### Blueprints

| # | Task | File | Status |
|---|------|------|--------|
| 4.2 | Blueprint list page | `app/(dashboard)/blueprints/page.tsx` | ✅ |
| 4.3 | Blueprint create page | `app/(dashboard)/blueprints/new/page.tsx` | ✅ |
| 4.4 | Blueprint edit page | `app/(dashboard)/blueprints/[id]/page.tsx` | ✅ |
| 4.5 | Shared blueprint form | `components/blueprints/blueprint-form.tsx` | ✅ |

### Exercises

| # | Task | File | Status |
|---|------|------|--------|
| 4.6 | Exercise search/browse page | `app/(dashboard)/exercises/page.tsx` | ✅ |
| 4.7 | Exercise card component | `components/exercises/exercise-card.tsx` | ✅ |

### Preset Resets

| # | Task | File | Status |
|---|------|------|--------|
| 4.8 | Preset reset list page | `app/(dashboard)/preset-resets/page.tsx` | ✅ |
| 4.9 | Preset reset create page | `app/(dashboard)/preset-resets/new/page.tsx` | ✅ |
| 4.10 | Preset reset edit page | `app/(dashboard)/preset-resets/[id]/page.tsx` | ✅ |
| 4.11 | Shared reset form | `components/preset-resets/reset-form.tsx` | ✅ |

### Tips

| # | Task | File | Status |
|---|------|------|--------|
| 4.12 | Tips list page | `app/(dashboard)/tips/page.tsx` | ✅ |
| 4.13 | Tip create page | `app/(dashboard)/tips/new/page.tsx` | ✅ |
| 4.14 | Tip edit page | `app/(dashboard)/tips/[id]/page.tsx` | ✅ |
| 4.15 | Shared tip form | `components/tips/tip-form.tsx` | ✅ |
| 4.16 | Tip templates page | `app/(dashboard)/tips/templates/page.tsx` | ✅ |

### Quotes

| # | Task | File | Status |
|---|------|------|--------|
| 4.17 | Quotes page (dialog CRUD) | `app/(dashboard)/quotes/page.tsx` | ✅ |

**Verify:** All CRUD operations work, filters/pagination work, forms validate.

---

## Phase 5: Workouts & Users

📄 **Guide:** [PHASE-5-WORKOUTS-AND-USERS.md](./PHASE-5-WORKOUTS-AND-USERS.md)

### Workouts

| # | Task | File | Status |
|---|------|------|--------|
| 5.1 | Daily generation controls | `app/(dashboard)/workouts/page.tsx` | ✅ |
| 5.2 | Exercise alternatives page | `app/(dashboard)/workouts/alternatives/page.tsx` | ✅ |
| 5.3 | Exercise search select (single) | `components/exercise-search-select.tsx` | ✅ |

### Users

| # | Task | File | Status |
|---|------|------|--------|
| 5.4 | User management (soft-deleted) | `app/(dashboard)/users/page.tsx` | ✅ |
| 5.5 | Admin roles (promote/demote) | `app/(dashboard)/users/admins/page.tsx` | ✅ |

### Corporate

| # | Task | File | Status |
|---|------|------|--------|
| 5.6 | Corporate accounts list | `app/(dashboard)/corporate/page.tsx` | ✅ |
| 5.7 | Corporate account detail | `app/(dashboard)/corporate/[id]/page.tsx` | ✅ |

**Verify:** Generation controls work, alternatives CRUD works, role-based actions enforced.

---

## Phase 6: Settings

📄 **Guide:** [PHASE-6-SETTINGS.md](./PHASE-6-SETTINGS.md)

| # | Task | File | Status |
|---|------|------|--------|
| 6.1 | Pricing configuration | `app/(dashboard)/pricing/page.tsx` | ⬜ |
| 6.2 | Help center (categories + articles) | `app/(dashboard)/help-center/page.tsx` | ⬜ |
| 6.3 | API key management | `app/(dashboard)/api-keys/page.tsx` | ⬜ |

**Verify:** Pricing updates save, help center two-panel works, API key shown once on creation.

---

## Final Verification

| # | Check | Status |
|---|-------|--------|
| F.1 | `npm run build` — no build errors | ⬜ |
| F.2 | `npx tsc --noEmit` — no TypeScript errors | ⬜ |
| F.3 | `npm run lint` — no ESLint errors | ⬜ |
| F.4 | Login → Dashboard → all pages navigable | ⬜ |
| F.5 | Session persists on refresh | ⬜ |
| F.6 | Token auto-refresh works | ⬜ |
| F.7 | Non-admin users blocked | ⬜ |
| F.8 | super_admin-only actions hidden for admins | ⬜ |
| F.9 | All CRUD ops work against live API | ⬜ |
| F.10 | Toast notifications for success/error | ⬜ |
| F.11 | Loading skeletons display | ⬜ |
| F.12 | Empty states display | ⬜ |
| F.13 | Responsive on tablet+ screens | ⬜ |
| F.14 | No console errors in browser | ⬜ |

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Complete |
| ⚠️ | Blocked / needs attention |
| ❌ | Skipped / not needed |

---

## Quick Reference

| Resource | Path |
|----------|------|
| API Guide | [ADMIN_APP_GUIDE.md](./ADMIN_APP_GUIDE.md) |
| Phase 1 — Setup | [PHASE-1-PROJECT-SETUP.md](./PHASE-1-PROJECT-SETUP.md) |
| Phase 2 — Auth & Layout | [PHASE-2-AUTH-AND-LAYOUT.md](./PHASE-2-AUTH-AND-LAYOUT.md) |
| Phase 3 — Components & Hooks | [PHASE-3-REUSABLE-COMPONENTS.md](./PHASE-3-REUSABLE-COMPONENTS.md) |
| Phase 4 — Content Pages | [PHASE-4-CONTENT-PAGES.md](./PHASE-4-CONTENT-PAGES.md) |
| Phase 5 — Workouts & Users | [PHASE-5-WORKOUTS-AND-USERS.md](./PHASE-5-WORKOUTS-AND-USERS.md) |
| Phase 6 — Settings | [PHASE-6-SETTINGS.md](./PHASE-6-SETTINGS.md) |
| Backend Base URL | `NEXT_PUBLIC_API_URL` in `.env.local` |
| Brand Colors | Navy `#31407F` · Orange `#FF670E` · Cream `#FFFDEE` |
| Font | Montserrat (Google Fonts) |
