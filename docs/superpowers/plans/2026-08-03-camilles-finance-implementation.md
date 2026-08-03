# Camille's Finance Pixel Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private Supabase-backed household budgeting PWA whose continuously replaying pixel-bank dashboard visualizes each paycheck allocation and supports editable family characters.

**Architecture:** A React/Vite TypeScript client keeps all money and scheduling logic in pure integer-cent domain modules. A scene-planning module converts immutable paycheck-allocation results into ordered bank stops; the renderer animates that plan but never calculates money. Supabase Auth gates the app, Postgres stores owner-scoped budget and character records, and private Storage holds optional background media.

**Tech Stack:** React 19, TypeScript, Vite, React Router, Supabase JS, date-fns, Zod, Vitest, Testing Library, Playwright, CSS transforms/animations, PWA manifest/service worker.

## Global Constraints

- Brand name is `Camille's Finance`; palette is royal purple, deep plum, warm gold, white, and pale lavender.
- One pre-created Supabase Auth account; public signup is disabled.
- No credentials, financial records, or service-role keys in source code or README.
- All money uses integer cents.
- Every exposed table and private Storage object is protected by owner-scoped RLS.
- The bank animation loops continuously without audio and updates on the next loop after saved data changes.
- Active characters are Black pixel characters built from preset skin tone, hair, outfit, and body options.
- Remaining savings equals `max(goal - actual saved, 0)`.
- Completed historical allocations never change.
- Responsive at phone width and Raspberry Pi landscape resolution.
- Reduced-motion mode uses fades and room highlights instead of walking.
- Uploaded MP4 backgrounds autoplay muted, loop, play inline, and pause while hidden.
- README stays limited to purpose, setup, environment-variable names, and deployment commands.

---

## File Map

- `src/domain/` — money, paydays, bill assignment, savings, and bank-scene planning.
- `src/data/` — repository contracts, Supabase implementations, and live budget state.
- `src/features/auth/` — one-account sign-in and protected routes.
- `src/features/bank/` — bank layout, room screens, characters, route playback, and HUD.
- `src/features/characters/` — preset editor and walking preview.
- `src/features/budget/` — paycheck, bill, and savings-goal editors.
- `src/features/calendar/` — payday and bill due-date calendar.
- `src/features/settings/` — background media and display controls.
- `supabase/migrations/` — schema, grants, triggers, Storage, and RLS.
- `tests/e2e/` — authenticated workflows and responsive checks.

### Task 1: Application shell and test gates

**Files:**
- Create: `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/styles/tokens.css`, `src/styles/global.css`
- Create: `src/test/setup.ts`, `src/App.test.tsx`
- Create: `public/manifest.webmanifest`, `.env.example`, `.gitignore`, `README.md`

**Interfaces:**
- Produces routes `/login`, `/`, `/accounts`, `/bills`, `/calendar`, `/goals`, `/characters`, and `/settings`.

- [ ] **Step 1: Write the failing shell test**

```tsx
it("renders Camille's Finance navigation", () => {
  render(<MemoryRouter><App /></MemoryRouter>);
  expect(screen.getByText("Camille's Finance")).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /characters/i })).toBeVisible();
});
```

- [ ] **Step 2: Run the focused test and confirm the missing application failure**

Run: `npm test -- src/App.test.tsx --run`  
Expected: FAIL because `App` does not exist.

- [ ] **Step 3: Scaffold the typed Vite app and responsive route shell**

```tsx
export const routes = [
  ['/', 'Bank'],
  ['/bills', 'Bills'],
  ['/calendar', 'Calendar'],
  ['/goals', 'Savings'],
  ['/characters', 'Characters'],
  ['/settings', 'Settings'],
] as const;
```

Pin dependencies, add `dev`, `build`, `test`, `lint`, and `test:e2e` scripts, and define purple/gold CSS tokens.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- --run && npm run build`  
Expected: PASS and production build exit code 0.

Commit: `git commit -am "feat: scaffold Camille's Finance shell"`

### Task 2: Deterministic paycheck allocation engine

**Files:**
- Create: `src/domain/types.ts`, `src/domain/paydays.ts`, `src/domain/assignBills.ts`, `src/domain/savings.ts`
- Test: `src/domain/paydays.test.ts`, `src/domain/assignBills.test.ts`, `src/domain/savings.test.ts`

**Interfaces:**
- Produces `generatePaydays(startIso: string, count: number, intervalDays: number): Paycheck[]`.
- Produces `assignBills(input: AssignmentInput): AssignmentResult`.
- Produces `calculateSavings(goal: SavingsGoal): SavingsProgress`.
- `AssignmentResult` contains `allocations`, `paycheckSummaries`, and `warnings`, all in integer cents.

- [ ] **Step 1: Define types and failing savings/payday tests**

```ts
expect(calculateSavings({
  targetCents: 2_000_000,
  actualCents: 390_000,
  scheduledCents: 470_000,
})).toEqual({
  remainingCents: 1_610_000,
  varianceCents: -80_000,
  progress: 0.195,
});
expect(generatePaydays('2026-08-07', 2, 14).map(p => p.date))
  .toEqual(['2026-08-07', '2026-08-21']);
```

- [ ] **Step 2: Run tests and confirm missing exports**

Run: `npm test -- src/domain --run`  
Expected: FAIL on unresolved `calculateSavings` and `generatePaydays`.

- [ ] **Step 3: Implement savings and payday functions**

```ts
export function calculateSavings(goal: SavingsGoal): SavingsProgress {
  return {
    remainingCents: Math.max(goal.targetCents - goal.actualCents, 0),
    varianceCents: goal.actualCents - goal.scheduledCents,
    progress: goal.targetCents === 0 ? 1 : Math.min(goal.actualCents / goal.targetCents, 1),
  };
}
```

- [ ] **Step 4: Write failing assignment tests**

Cover latest safe paycheck, no assignment after due date, manual full/split modes, overloaded automatic 50/50 split, odd-cent remainder, priority ordering, unchanged completed allocations, and negative safe-to-use warnings.

```ts
expect(result.allocations).toEqual([
  { paycheckId: 'p1', billId: 'rent', cents: 75_000 },
  { paycheckId: 'p2', billId: 'rent', cents: 75_000 },
]);
```

- [ ] **Step 5: Implement stable allocation and reconciliation**

```ts
export function assignBills(input: AssignmentInput): AssignmentResult {
  const open = input.paychecks.filter(p => !p.completed).sort(byDate);
  const allocations = [...input.completedAllocations];
  for (const bill of [...input.billOccurrences].sort(byPriorityThenDueDate)) {
    allocations.push(...allocateOccurrence(bill, open, input.preferences));
  }
  return summarize(open, allocations, input.savingsTargets);
}
```

- [ ] **Step 6: Verify and commit**

Run: `npm test -- src/domain --run`  
Expected: all domain tests PASS.

Commit: `git commit -am "feat: add deterministic paycheck engine"`

### Task 3: Bank scene planner

**Files:**
- Create: `src/domain/bankScene.ts`
- Test: `src/domain/bankScene.test.ts`

**Interfaces:**
- Consumes `AssignmentResult`, active bills, active goals, active characters, and selected paycheck ID.
- Produces `buildBankScene(input: BankSceneInput): BankScenePlan`.
- `BankScenePlan` contains immutable `rooms`, `characters`, `stops`, `hud`, and `revision`.
- Each `BankStop` is `{ characterId, destinationId, kind, amountCents, status }`.

- [ ] **Step 1: Write failing route-planning tests**

```ts
expect(plan.stops.map(stop => stop.destinationId)).toEqual([
  'entrance', 'rent', 'car-payment', 'house', 'exit',
]);
expect(plan.hud.nextPaycheckCents).toBe(253_288);
```

Test empty paychecks, unfunded rooms, split bills, multiple characters using round-robin assignment, archived characters, and savings stops.

- [ ] **Step 2: Run and confirm the missing planner failure**

Run: `npm test -- src/domain/bankScene.test.ts --run`  
Expected: FAIL because `buildBankScene` is not exported.

- [ ] **Step 3: Implement a renderer-independent immutable plan**

```ts
export function buildBankScene(input: BankSceneInput): BankScenePlan {
  const allocations = input.assignment.allocations
    .filter(item => item.paycheckId === input.selectedPaycheckId);
  return Object.freeze({
    revision: input.revision,
    hud: buildHud(input, allocations),
    rooms: buildRoomScreens(input, allocations),
    characters: input.characters.filter(character => character.active),
    stops: buildStops(allocations, input.goals, input.characters),
  });
}
```

- [ ] **Step 4: Verify deterministic output and commit**

Run: `npm test -- src/domain/bankScene.test.ts --run`  
Expected: PASS with the same input producing deeply equal plans.

Commit: `git commit -am "feat: plan pixel bank deposit routes"`

### Task 4: Supabase schema, Auth, Storage, and RLS

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/<timestamp>_initial_budget_schema.sql`
- Create: `src/lib/supabase.ts`, `src/lib/database.types.ts`
- Test: `supabase/tests/rls.sql`

**Interfaces:**
- Produces tables `profiles`, `household_settings`, `income_sources`, `paychecks`, `bills`, `bill_occurrences`, `paycheck_allocations`, `savings_goals`, `savings_entries`, `characters`, and `background_media`.
- `characters` fields: `id`, `user_id`, `name`, `skin_tone`, `hairstyle`, `hair_color`, `shirt_color`, `pants_color`, `body_style`, `active`, `sort_order`.

- [ ] **Step 1: Verify current official Supabase guidance**

Fetch `https://supabase.com/changelog.md`, scan applicable breaking changes, then verify Auth password sign-in, owner RLS, private Storage, and current JavaScript client APIs in official documentation.

- [ ] **Step 2: Create the migration**

Use `bigint` cents, `date`/`timestamptz` dates, UUID keys, constraints, updated timestamps, and owner IDs.

```sql
create table public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  skin_tone text not null check (skin_tone in ('deep','dark','brown','warm')),
  hairstyle text not null check (hairstyle in ('fade','waves','locs','braids','afro','curls','bun')),
  hair_color text not null default '#1f130f',
  shirt_color text not null default '#4c1d95',
  pants_color text not null default '#24113f',
  body_style text not null check (body_style in ('slim','average','broad','curvy')),
  active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);
alter table public.characters enable row level security;
create policy "owners manage characters" on public.characters
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
```

Apply matching owner policies to every exposed table and private Storage path `${auth.uid()}/...`.

- [ ] **Step 3: Add one-account Auth configuration**

Disable public signup. The login page contains no signup route. Create the sole user through the protected Supabase dashboard workflow; do not place credentials in migrations, source, tests, or documentation.

- [ ] **Step 4: Run database security verification**

Run: `supabase db reset && supabase test db`  
Expected: owner reads/writes succeed; anonymous and second-user access fail.

Run current Supabase database and security advisors and resolve error-level findings.

- [ ] **Step 5: Generate types and commit**

Run: `supabase gen types typescript --local > src/lib/database.types.ts`

Commit: `git commit -am "feat: secure budget and character data"`

### Task 5: Authentication and typed repository

**Files:**
- Create: `src/features/auth/LoginPage.tsx`, `src/features/auth/RequireAuth.tsx`, `src/features/auth/auth.test.tsx`
- Create: `src/data/BudgetRepository.ts`, `src/data/SupabaseBudgetRepository.ts`, `src/data/useBudget.ts`
- Create: `src/lib/schemas.ts`
- Test: `src/data/SupabaseBudgetRepository.test.ts`

**Interfaces:**
- Produces `BudgetRepository.loadBudget()`, `saveIncomeSource()`, `saveBill()`, `archiveBill()`, `saveGoal()`, `recordSavings()`, `savePaycheckActuals()`, `saveCharacter()`, `archiveCharacter()`, and `saveBackground()`.
- Produces `useBudget(): { data, sceneRevision, status, error, mutate }`.
- Every successful mutation increments `sceneRevision`; failed mutations preserve the last valid data and revision.

- [ ] **Step 1: Write failing authentication and repository tests**

```tsx
it('redirects an anonymous visitor to login', async () => {
  renderApp({ session: null, initialPath: '/' });
  expect(await screen.findByRole('heading', { name: /sign in/i })).toBeVisible();
});
```

Test generic password errors, no signup control, typed row mapping, successful revision increments, and failed mutation rollback.

- [ ] **Step 2: Implement password sign-in and protected routing**

Use `signInWithPassword`, preserve the intended route, and never expose whether the email or password was incorrect.

- [ ] **Step 3: Add Zod inputs and repository mappings**

```ts
export const CharacterInput = z.object({
  name: z.string().trim().min(1).max(40),
  skinTone: z.enum(['deep','dark','brown','warm']),
  hairstyle: z.enum(['fade','waves','locs','braids','afro','curls','bun']),
  hairColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  shirtColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  pantsColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  bodyStyle: z.enum(['slim','average','broad','curvy']),
  active: z.boolean(),
});
```

- [ ] **Step 4: Implement save states and live revision updates**

Render `Saving`, `Saved`, or an actionable error only after Supabase responds. Do not animate unsaved values.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- src/features/auth src/data --run`  
Expected: PASS.

Commit: `git commit -am "feat: authenticate and persist household data"`

### Task 6: Living pixel-bank dashboard

**Files:**
- Create: `src/features/bank/BankPage.tsx`, `BankScene.tsx`, `BankRoom.tsx`, `BankCharacter.tsx`, `BankHud.tsx`, `SavingsVault.tsx`
- Create: `src/features/bank/useBankLoop.ts`, `src/features/bank/bank.css`
- Test: `src/features/bank/BankPage.test.tsx`, `src/features/bank/useBankLoop.test.tsx`

**Interfaces:**
- Consumes `BankScenePlan` and `sceneRevision`.
- Produces `useBankLoop(plan): { activeStop, phase, loopNumber, paused }`.
- Plan changes are queued while a loop is running and applied at the next entrance phase.

- [ ] **Step 1: Write failing bank screen and loop tests**

```tsx
expect(screen.getByRole('heading', { name: /camille's finance bank/i })).toBeVisible();
expect(screen.getByText(/rent/i)).toBeVisible();
expect(screen.getByText(/funded/i)).toBeVisible();
expect(screen.getByText(/actually saved/i)).toBeVisible();
```

Using fake timers, verify entrance → bill rooms → vault → exit → entrance, continuous replay, pause/resume, next-loop plan replacement, and reduced motion.

- [ ] **Step 2: Implement semantic room screens and HUD**

Every room exposes a readable heading, amount, due date, assigned paycheck, and status independent of animation. The HUD shows next paycheck, bills to fund, safe to use, and payday.

- [ ] **Step 3: Implement the loop state machine**

```ts
type Phase = 'entrance' | 'walking' | 'depositing' | 'exit' | 'reset';

function nextPhase(phase: Phase): Phase {
  return {
    entrance: 'walking',
    walking: 'depositing',
    depositing: 'walking',
    exit: 'reset',
    reset: 'entrance',
  }[phase] as Phase;
}
```

Queue updated plans by `revision`; swap only during `reset` so characters never jump mid-route.

- [ ] **Step 4: Render responsive pixel-art composition**

Build the bank from CSS pixel textures, positioned rooms, accessible HTML screens, and CSS-transform character movement. Desktop/Pi uses the full floor plan; phone uses a scrollable room grid with a sticky HUD. No canvas is required in version one.

- [ ] **Step 5: Add reduced-motion and visibility handling**

When `prefers-reduced-motion: reduce`, use 150ms fades and destination highlights. Pause timers on `document.hidden` and resume from the current stop.

- [ ] **Step 6: Verify and commit**

Run: `npm test -- src/features/bank --run && npm run build`  
Expected: loop tests PASS and build exits 0.

Commit: `git commit -am "feat: animate the living pixel bank"`

### Task 7: Family character editor

**Files:**
- Create: `src/features/characters/CharactersPage.tsx`, `CharacterForm.tsx`, `CharacterPreview.tsx`, `PixelPerson.tsx`, `characterPresets.ts`
- Create: `src/features/characters/characters.css`
- Test: `src/features/characters/CharacterForm.test.tsx`, `src/features/characters/CharacterPreview.test.tsx`

**Interfaces:**
- Consumes `CharacterInput` and repository `saveCharacter`/`archiveCharacter`.
- Produces reusable `<PixelPerson character={character} pose="idle" | "walk-left" | "walk-right" />`.

- [ ] **Step 1: Write failing editor and preview tests**

```tsx
await user.selectOptions(screen.getByLabelText(/hairstyle/i), 'locs');
await user.click(screen.getByRole('button', { name: /save character/i }));
expect(repository.saveCharacter).toHaveBeenCalledWith(
  expect.objectContaining({ hairstyle: 'locs' }),
);
```

Test name, Black skin-tone presets, hairstyle, hair/outfit colors, body style, active toggle, archive confirmation, and walking preview.

- [ ] **Step 2: Define reusable preset geometry**

```ts
export const hairstyles = ['fade','waves','locs','braids','afro','curls','bun'] as const;
export const skinTones = {
  deep: '#3b2118',
  dark: '#563122',
  brown: '#75462f',
  warm: '#925f40',
} as const;
```

Render pixels as CSS grid cells so the same component works in previews and the bank.

- [ ] **Step 3: Implement form, live preview, and selection list**

Preview changes are local until Save succeeds. Active characters appear in sort order; archived characters disappear from the next bank plan but remain restorable in data.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- src/features/characters --run`  
Expected: PASS.

Commit: `git commit -am "feat: customize family bank characters"`

### Task 8: Budget editors, calendar, and automatic recalculation

**Files:**
- Create: `src/features/budget/AccountsPage.tsx`, `BillsPage.tsx`, `BillForm.tsx`, `GoalsPage.tsx`, `PaycheckForm.tsx`
- Create: `src/features/calendar/CalendarPage.tsx`, `calendarModel.ts`
- Test: `src/features/budget/BillForm.test.tsx`, `src/features/budget/recalculate.test.tsx`, `src/features/calendar/calendarModel.test.ts`

**Interfaces:**
- Consumes `BudgetRepository`, `assignBills`, and `buildBankScene`.
- Produces editable income, bill, paycheck, and goal workflows plus month/agenda events.

- [ ] **Step 1: Write failing editor and calendar tests**

Test add/edit/archive bills, due-day validation, assignment overrides, actual pay, actual savings, purple payday markers, pink bill markers, gold savings markers, and immediate scene revision after successful saves.

- [ ] **Step 2: Implement focused editor pages**

Bill fields: name, amount, due day, category, priority, recurrence, autopay, notes, active state, and automatic/full/split assignment. Money inputs parse decimal strings into integer cents before validation.

- [ ] **Step 3: Implement month and agenda calendar**

Event selection shows amount, due date, funding paycheck, funded status, and an edit action.

- [ ] **Step 4: Add Raspberry Pi button shortcut**

```ts
window.addEventListener('keydown', event => {
  const target = event.target as HTMLElement;
  if (event.key === 'F8' && !['INPUT','SELECT','TEXTAREA'].includes(target.tagName)) {
    navigate(location.pathname === '/calendar' ? '/' : '/calendar');
  }
});
```

- [ ] **Step 5: Verify and commit**

Run: `npm test -- src/features/budget src/features/calendar --run`  
Expected: PASS.

Commit: `git commit -am "feat: edit budgets and calendar events"`

### Task 9: Private background media and PWA behavior

**Files:**
- Create: `src/features/settings/BackgroundSettings.tsx`, `BackgroundLayer.tsx`, `backgroundMedia.ts`
- Test: `src/features/settings/backgroundMedia.test.tsx`
- Modify: `src/App.tsx`, `public/manifest.webmanifest`

**Interfaces:**
- Consumes private Storage object metadata and an authenticated signed URL.
- Produces photo/video backdrop, purple veil, opacity/blur settings, fallback color, and PWA metadata.

- [ ] **Step 1: Write failing media tests**

```tsx
expect(video).toHaveAttribute('muted');
expect(video).toHaveAttribute('loop');
expect(video).toHaveAttribute('playsinline');
```

Test JPEG/PNG/WebP/MP4 validation, size rejection, replacement, removal, reduced motion, and visibility pause/resume.

- [ ] **Step 2: Implement private validated uploads**

Store at `${userId}/${crypto.randomUUID()}.${extension}`; persist metadata only after Storage confirms success.

- [ ] **Step 3: Implement the media layer**

```tsx
return media.kind === 'video'
  ? <video src={url} autoPlay muted loop playsInline aria-hidden />
  : <img src={url} alt="" aria-hidden />;
```

Place a configurable purple veil between the media and bank UI, with a solid-purple fallback on errors.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- src/features/settings --run && npm run build`  
Expected: PASS and build exit 0.

Commit: `git commit -am "feat: add private dashboard backgrounds"`

### Task 10: End-to-end verification and release readiness

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/budget-flow.spec.ts`, `tests/e2e/bank-loop.spec.ts`, `tests/e2e/pi-display.spec.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes the complete app and seeded test user through test-only environment variables.
- Produces a verified deployable branch and preview.

- [ ] **Step 1: Write authenticated browser flows**

```ts
test('saved bill change updates the next bank loop', async ({ page }) => {
  await login(page);
  await editBill(page, 'Car Payment', { amount: '425.00', dueDay: 11 });
  await page.getByRole('link', { name: 'Bank' }).click();
  await expect(page.getByTestId('car-payment-screen')).toContainText('$425.00');
  await expect(page.getByTestId('scene-revision')).toHaveAttribute('data-applied', 'true');
});
```

Also cover character customization, adding a credit-card bill, split assignment, actual savings, calendar markers, muted background video, logout, and anonymous redirects.

- [ ] **Step 2: Run all automated checks**

Run: `npm test -- --run && npm run lint && npm run build && npm run test:e2e`  
Expected: all commands exit 0.

- [ ] **Step 3: Verify security and device layouts**

Run Supabase RLS tests and advisors. Inspect phone, desktop, and Raspberry Pi landscape layouts. Confirm no secrets appear in tracked files with `git grep -nE '(service_role|Supaduck|avs@)' -- . ':!package-lock.json'`; expected output is empty.

- [ ] **Step 4: Review against the approved specification**

Confirm every bill room remains readable without motion, the Savings Vault includes all active goals, saved edits appear on the next loop, character presets persist, failed saves preserve the last valid loop, and reduced-motion mode remains usable.

- [ ] **Step 5: Commit release verification**

Commit: `git commit -am "test: verify Camille's Finance pixel bank"`

- [ ] **Step 6: Publish through a reviewed branch**

Push the implementation branch, open a draft pull request, verify CI and the deployed preview, and merge only after the user approves the working application.
