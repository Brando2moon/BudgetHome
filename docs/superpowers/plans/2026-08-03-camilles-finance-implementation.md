# Camille's Finance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private Supabase-backed household budgeting PWA that assigns bills to biweekly paychecks, recalculates savings goals, and presents the approved royal-purple-and-gold dashboard on phone, desktop, and Raspberry Pi.

**Architecture:** A React/Vite TypeScript client owns deterministic money and scheduling calculations in pure domain modules. Supabase Auth gates every route, Postgres stores user-owned budget records under RLS, and private Storage holds optional dashboard media. UI pages consume typed repository functions and never perform financial arithmetic directly.

**Tech Stack:** React 19, TypeScript, Vite, React Router, Supabase JS, date-fns, Zod, Vitest, Testing Library, Playwright, CSS, PWA manifest/service worker.

## Global Constraints

- Brand name is `Camille's Finance`; palette is royal purple, deep plum, warm gold, white, and pale lavender.
- One pre-created Supabase Auth account; public signup is disabled.
- No credentials, financial records, or service-role keys in source code or README.
- All money uses integer cents.
- Every exposed table and private Storage object is protected by owner-scoped RLS.
- Remaining savings equals `max(goal - actual saved, 0)`.
- Responsive at phone width and Raspberry Pi landscape resolution.
- Uploaded MP4 backgrounds autoplay muted, loop, play inline, and stop when hidden.

---

## File Map

- `src/domain/` — pure money, payday, assignment, and savings calculations.
- `src/lib/` — Supabase client, validation schemas, and formatting helpers.
- `src/data/` — typed persistence interfaces and Supabase implementations.
- `src/features/auth/` — sign-in and protected-route behavior.
- `src/features/dashboard/` — command-center dashboard and goal summary.
- `src/features/budget/` — income, bill, paycheck, and goal editors.
- `src/features/calendar/` — payday and due-date calendar.
- `src/features/settings/` — background-media controls and display settings.
- `supabase/migrations/` — schema, triggers, grants, and RLS policies.
- `tests/e2e/` — authenticated browser workflows.

### Task 1: Application shell and quality gates

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/styles/tokens.css`, `src/styles/global.css`
- Create: `src/test/setup.ts`, `src/App.test.tsx`
- Create: `public/manifest.webmanifest`, `.env.example`, `.gitignore`, `README.md`

**Interfaces:**
- Produces: React application root and routes `/login`, `/`, `/accounts`, `/bills`, `/calendar`, `/goals`, `/settings`.

- [ ] **Step 1: Write the failing shell test**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';

it('renders the Camille’s Finance shell', () => {
  render(<MemoryRouter><App /></MemoryRouter>);
  expect(screen.getByText("Camille's Finance")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm test -- src/App.test.tsx --run`

Expected: FAIL because `App` and the test setup do not exist.

- [ ] **Step 3: Scaffold the Vite app and minimal shell**

```tsx
export function App() {
  return <main><h1>Camille's Finance</h1></main>;
}
```

Add scripts `dev`, `build`, `test`, `test:watch`, `lint`, and `test:e2e`; pin dependency versions and commit the lockfile. Keep README to product purpose, setup commands, environment-variable names, and build command only.

- [ ] **Step 4: Add design tokens and responsive foundations**

```css
:root {
  --purple-950: #1d0638;
  --purple-800: #3b0c6e;
  --purple-600: #6d28d9;
  --gold-500: #d4af37;
  --gold-300: #f2c94c;
  --surface: rgba(255, 255, 255, .88);
  --text: #24113f;
}
```

- [ ] **Step 5: Verify and commit**

Run: `npm test -- --run && npm run build`

Expected: PASS and a successful production build.

Commit: `git commit -am "feat: scaffold Camille's Finance app shell"`

### Task 2: Deterministic budgeting engine

**Files:**
- Create: `src/domain/types.ts`, `src/domain/paydays.ts`, `src/domain/assignBills.ts`, `src/domain/savings.ts`
- Create: `src/domain/paydays.test.ts`, `src/domain/assignBills.test.ts`, `src/domain/savings.test.ts`

**Interfaces:**
- Produces: `generatePaydays(startIso, count, intervalDays)`, `assignBills(input)`, `calculateSavings(goal)`, and integer-cent domain types.

- [ ] **Step 1: Define types and failing savings tests**

```ts
export type SavingsGoal = {
  targetCents: number;
  actualCents: number;
  scheduledCents: number;
};

expect(calculateSavings({ targetCents: 2_000_000, actualCents: 390_000, scheduledCents: 470_000 }))
  .toEqual({ remainingCents: 1_610_000, varianceCents: -80_000, progress: 0.195 });
```

- [ ] **Step 2: Run tests and confirm missing implementations**

Run: `npm test -- src/domain --run`

Expected: FAIL on missing exported functions.

- [ ] **Step 3: Implement savings and payday functions**

```ts
export function calculateSavings(goal: SavingsGoal) {
  return {
    remainingCents: Math.max(goal.targetCents - goal.actualCents, 0),
    varianceCents: goal.actualCents - goal.scheduledCents,
    progress: goal.targetCents === 0 ? 1 : Math.min(goal.actualCents / goal.targetCents, 1),
  };
}
```

- [ ] **Step 4: Write failing assignment tests**

Cover: latest payday before due date, never after due date, always-split override, overload-triggered 50/50 split, integer-cent remainder on later paycheck, priority reductions, completed allocations staying unchanged, and negative safe-to-use warnings.

```ts
expect(result.allocations).toEqual([
  { paycheckId: 'p1', billId: 'rent', cents: 75_000 },
  { paycheckId: 'p2', billId: 'rent', cents: 75_000 },
]);
```

- [ ] **Step 5: Implement `assignBills` with stable priority ordering**

```ts
export function assignBills(input: AssignmentInput): AssignmentResult {
  const open = input.paychecks.filter(p => !p.completed).sort(byDate);
  const allocations = [...input.completedAllocations];
  for (const bill of input.billOccurrences.sort(byPriorityThenDueDate)) {
    allocations.push(...allocateOccurrence(bill, open, input.preferences));
  }
  return reconcileAndSummarize(open, allocations, input.goals);
}
```

- [ ] **Step 6: Verify and commit**

Run: `npm test -- src/domain --run`

Expected: all domain tests PASS without network access.

Commit: `git commit -am "feat: add paycheck allocation engine"`

### Task 3: Supabase schema, Auth, and RLS

**Files:**
- Create: `supabase/config.toml`
- Create through CLI: `supabase/migrations/<timestamp>_initial_budget_schema.sql`
- Create: `src/lib/supabase.ts`, `src/lib/database.types.ts`
- Create: `supabase/tests/rls.sql`

**Interfaces:**
- Produces tables `profiles`, `household_settings`, `income_sources`, `paychecks`, `bills`, `bill_occurrences`, `paycheck_allocations`, `savings_goals`, `savings_entries`, `background_media`.
- Consumes domain amounts as integer cents.

- [ ] **Step 1: Verify current Supabase changelog and official docs**

Check current Auth, RLS, Storage, and JavaScript client guidance before choosing APIs. Record only official links in migration comments when a security choice needs explanation.

- [ ] **Step 2: Create the migration with CLI discovery**

Run: `supabase migration new initial_budget_schema`

Use `bigint` for cents, `date`/`timestamptz` for dates, `uuid` primary keys, `auth.uid()` ownership, and check constraints requiring nonnegative amounts.

```sql
create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  amount_cents bigint not null check (amount_cents >= 0),
  due_day smallint check (due_day between 1 and 31),
  assignment_mode text not null default 'automatic'
    check (assignment_mode in ('automatic','full','split')),
  priority smallint not null check (priority between 1 and 6),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.bills enable row level security;
create policy "owners manage bills" on public.bills
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
```

- [ ] **Step 3: Add private Storage policies**

Create bucket `budget-backgrounds` as private. Require the first path segment to equal `auth.uid()::text` for select, insert, update, and delete policies.

- [ ] **Step 4: Disable public signup and create one user through Supabase Auth**

Do not use credentials from chat or source files. Create the user through the Supabase dashboard or protected admin workflow, then disable new-user registration.

- [ ] **Step 5: Run migrations, RLS tests, and advisors**

Run: `supabase db reset`, `supabase test db`, and the available database/security advisors.

Expected: authenticated owner succeeds; anonymous and other-user reads/writes fail.

- [ ] **Step 6: Generate types and commit**

Run: `supabase gen types typescript --local > src/lib/database.types.ts`

Commit: `git commit -am "feat: add secure Supabase budget schema"`

### Task 4: Authentication and typed data access

**Files:**
- Create: `src/features/auth/LoginPage.tsx`, `src/features/auth/RequireAuth.tsx`, `src/features/auth/auth.test.tsx`
- Create: `src/data/BudgetRepository.ts`, `src/data/SupabaseBudgetRepository.ts`, `src/data/useBudget.ts`
- Create: `src/lib/schemas.ts`

**Interfaces:**
- Produces `BudgetRepository` methods `loadBudget`, `saveIncomeSource`, `saveBill`, `archiveBill`, `saveGoal`, `recordSavings`, `savePaycheckActuals`, and `saveBackground`.
- Produces route guard `RequireAuth`.

- [ ] **Step 1: Write failing protected-route tests**

```tsx
it('redirects an anonymous visitor to login', async () => {
  renderApp({ session: null, initialPath: '/' });
  expect(await screen.findByRole('heading', { name: /sign in/i })).toBeVisible();
});
```

- [ ] **Step 2: Implement sign-in and route guard**

Use `signInWithPassword`, never render a sign-up control, use generic login errors, and preserve the intended route after authentication.

- [ ] **Step 3: Define Zod validation and repository interface**

```ts
export const BillInput = z.object({
  name: z.string().trim().min(1).max(120),
  amountCents: z.number().int().nonnegative(),
  dueDay: z.number().int().min(1).max(31),
  assignmentMode: z.enum(['automatic', 'full', 'split']),
  priority: z.number().int().min(1).max(6),
});
```

- [ ] **Step 4: Implement Supabase repository and saving states**

Every mutation returns the saved row or a typed error. UI state displays `Saving`, `Saved`, or an actionable error only after the Supabase response.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- src/features/auth src/data --run`

Commit: `git commit -am "feat: gate app and persist budget data"`

### Task 5: Approved dashboard and savings view

**Files:**
- Create: `src/features/dashboard/DashboardPage.tsx`, `KpiCard.tsx`, `SavingsHero.tsx`, `PaycheckPlan.tsx`, `UpcomingBills.tsx`, `MiniCalendar.tsx`
- Create: `src/features/dashboard/dashboard.css`, `src/features/dashboard/DashboardPage.test.tsx`

**Interfaces:**
- Consumes `useBudget`, `AssignmentResult`, and `calculateSavings`.
- Produces edit and add callbacks routed to management pages.

- [ ] **Step 1: Write failing dashboard tests**

```tsx
expect(screen.getByText('$2,532.88')).toBeVisible();
expect(screen.getByText('Remaining $16,100')).toBeVisible();
expect(screen.getByText('Behind $800')).toBeVisible();
```

- [ ] **Step 2: Implement semantic dashboard components**

Match the approved mockup: purple sidebar, gold accents, three KPI cards, full-width savings hero, allocation panel, upcoming bills, and mini calendar. Use buttons with accessible names for all pencil/edit icons.

- [ ] **Step 3: Implement Raspberry Pi and mobile layouts**

At wide landscape widths show the complete command center without horizontal scrolling. At phone widths collapse navigation, stack cards, keep large amounts readable, and preserve touch targets of at least 44px.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- src/features/dashboard --run && npm run build`

Commit: `git commit -am "feat: build Camille's Finance dashboard"`

### Task 6: Editors, calendar, and automatic recalculation

**Files:**
- Create: `src/features/budget/AccountsPage.tsx`, `BillsPage.tsx`, `BillForm.tsx`, `GoalsPage.tsx`, `PaycheckForm.tsx`
- Create: `src/features/calendar/CalendarPage.tsx`, `calendarModel.ts`, `calendarModel.test.ts`
- Create: `src/features/budget/BillForm.test.tsx`, `src/features/budget/recalculate.test.tsx`

**Interfaces:**
- Consumes `BudgetRepository` and domain assignment functions.
- Produces editable income, bill, paycheck, and goal workflows plus month/agenda calendar events.

- [ ] **Step 1: Write failing bill and calendar tests**

Test add/edit/archive, due-day validation, assignment override, payday marker, bill marker, selected-event detail, and immediate future-plan recalculation.

- [ ] **Step 2: Implement account and bill management**

Bill form fields: name, cents-safe amount input, due day, category, priority, recurrence, autopay, notes, active state, and automatic/full/split assignment.

- [ ] **Step 3: Implement goal and actual-pay editors**

Saving actual pay updates only the selected payday. Editing expected pay updates future generated paydays. Recording actual savings updates goal progress without altering historical planned allocations.

- [ ] **Step 4: Implement month and agenda calendar**

Purple payday markers, pink/red bill markers, and gold savings markers. Event selection displays amount, due date, funding paycheck, and edit action.

- [ ] **Step 5: Add hardware-button shortcut**

```ts
window.addEventListener('keydown', event => {
  if (event.key === 'F8') navigate(location.pathname === '/calendar' ? '/' : '/calendar');
});
```

Ignore the shortcut while typing in inputs, selects, or textareas.

- [ ] **Step 6: Verify and commit**

Run: `npm test -- src/features/budget src/features/calendar --run`

Commit: `git commit -am "feat: add budget editors and calendar"`

### Task 7: Background media and PWA display behavior

**Files:**
- Create: `src/features/settings/BackgroundSettings.tsx`, `BackgroundLayer.tsx`, `backgroundMedia.ts`, `backgroundMedia.test.tsx`
- Modify: `src/App.tsx`, `public/manifest.webmanifest`

**Interfaces:**
- Consumes private Storage path and authenticated signed URL.
- Produces image/video background, opacity/blur settings, fallback color, and PWA install metadata.

- [ ] **Step 1: Write failing media tests**

```tsx
expect(video).toHaveAttribute('muted');
expect(video).toHaveAttribute('loop');
expect(video).toHaveAttribute('playsinline');
```

Test allowed MIME types, size limits, replacement, removal, reduced motion, and visibility pause/resume.

- [ ] **Step 2: Implement validated private uploads**

Accept JPEG, PNG, WebP, and MP4 only. Store at `${userId}/${crypto.randomUUID()}.${extension}` and save metadata after Storage confirms success.

- [ ] **Step 3: Implement media layer**

```tsx
return media.kind === 'video'
  ? <video src={url} autoPlay muted loop playsInline aria-hidden />
  : <img src={url} alt="" aria-hidden />;
```

Overlay a configurable purple veil and frosted surfaces; fall back to solid purple on error.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- src/features/settings --run && npm run build`

Commit: `git commit -am "feat: add private dashboard backgrounds"`

### Task 8: End-to-end verification and release

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/budget-flow.spec.ts`, `tests/e2e/pi-display.spec.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes the complete app and seeded test user through test-only environment variables.
- Produces a verified deployable release.

- [ ] **Step 1: Write authenticated end-to-end flows**

```ts
test('income change reallocates future bills and savings', async ({ page }) => {
  await login(page);
  await editPaycheck(page, '2026-08-07', '2400.00');
  await expect(page.getByText('Plan adjusted')).toBeVisible();
  await expect(page.getByText(/negative safe-to-use/i)).toHaveCount(0);
});
```

Also cover adding a credit-card bill, editing a due date, split assignment, actual savings, calendar markers, media upload, logout, and anonymous redirects.

- [ ] **Step 2: Run all automated checks**

Run: `npm test -- --run && npm run lint && npm run build && npm run test:e2e`

Expected: all checks PASS.

- [ ] **Step 3: Verify security and responsive display**

Run Supabase advisors and RLS tests. Inspect phone, desktop, and Raspberry Pi landscape layouts. Confirm no credentials or financial values appear in tracked files with `git grep` searches for known environment variable values.

- [ ] **Step 4: Keep README concise and commit release**

README contains only name, short purpose, setup, environment-variable names, and build/deploy commands.

Commit: `git commit -am "test: verify Camille's Finance release"`

- [ ] **Step 5: Publish through a reviewed branch**

Push the implementation branch, open a draft pull request, verify CI, review the deployed preview, and merge only after the user approves the working app.
