# Camille's Finance — Product Design

Date: 2026-08-03  
Repository: Brando2moon/BudgetHome  
Status: Ready for implementation review

## Purpose

Camille's Finance is a private household budgeting progressive web app managed by one user. It combines both partners' income, predicts biweekly paydays, assigns bills to the safest paycheck, protects essentials first, and adjusts flexible goals when actual pay changes.

The app must work on phones, desktop browsers, and a full-screen Raspberry Pi monitor. A programmable hardware button can switch between the dashboard and calendar by sending a keyboard shortcut.

## Visual design

- Brand: **Camille's Finance**
- Palette: royal purple, deep plum, warm metallic gold, white, and pale lavender.
- Dashboard follows the approved command-center/goal-tracker mockup.
- Large high-contrast financial figures remain readable across a room.
- Cards use restrained frosted-glass surfaces when a custom background is active.
- User may upload a JPG, PNG, WebP, or MP4 dashboard background.
- Video backgrounds autoplay muted, loop continuously, use no audio, and pause when the page is not visible.
- The interface must retain a contrast overlay so financial data remains readable over any background.
- Reduced-motion users receive a still poster or solid background instead of motion.

## Access

- The entire application is login-gated; no dashboard, financial record, calendar, background media, or app data is accessible before authentication.
- One private Supabase Auth account is created directly in Supabase.
- Public registration is disabled. There is no sign-up page.
- Only the user manages the household budget.
- The spouse's income is recorded as a household income source but requires no separate login.
- Passwords are handled only by Supabase Auth and are never committed, hardcoded, logged, placed in the README, or stored in application tables.
- All exposed tables and storage objects use row-level security scoped to the authenticated owner.
- No secret or service-role key is exposed in the browser.
- Unauthenticated requests redirect to the sign-in screen; authenticated sessions use secure Supabase session handling.

## Main areas

### Dashboard

Shows:

- Next combined paycheck and date
- Bills assigned to that paycheck
- Safe-to-use amount after required allocations
- Paycheck allocation by category
- Upcoming bills
- Mini calendar with payday and bill-due markers
- Savings cards showing:
  - goal amount
  - amount that should be saved by today
  - amount actually saved
  - remaining amount = max(goal amount - actual saved, 0)
  - ahead/behind amount = actual saved - should-have-saved
  - progress percentage
- Quick actions to edit a paycheck, edit a savings goal, add a bill, and record actual savings

### Accounts and paychecks

- Editable income sources for Brandon and spouse
- Expected net amount, biweekly frequency, first known pay date, and active status
- Automatically generate recurring payday dates
- Record exact actual net pay for each person on every payday
- Combined payday amount equals the sum of the actual amounts when entered; otherwise expected amounts
- Past paycheck records remain stable even when future expected pay changes

### Bills

- Add, edit, pause, or archive bills
- Fields: name, amount, due day/date, category, essential/flexible status, recurrence, autopay, notes, and assignment preference
- Supports future credit-card bills and additional obligations
- Bill history is retained when an amount or due date changes
- An account page provides the full editable bill and due-date list

### Automatic paycheck assignment

For every bill occurrence:

1. Find the last available payday on or before the due date.
2. Assign the bill to that payday when the paycheck can fund it after higher-priority essentials.
3. If the bill is large, recurring, or would overload that payday, reserve half from each of the two preceding paydays.
4. Never schedule payment after the due date.
5. Allow the user to override an assignment or choose always-full, always-split, or automatic.
6. Recalculate future assignments when pay, bills, due dates, or goals change; do not silently rewrite completed periods.

Priority order:

1. Rent, utilities, insurance, car, and required bills
2. Groceries and vehicle fuel
3. Emergency/DailyPay buffer
4. House savings
5. MegaCon savings
6. Family fun and miscellaneous spending

If income falls, flexible allocations reduce from the bottom of this list upward. If income rises, the surplus goes to behind-schedule goals first, then the emergency buffer, then the highest-priority active goal.

### Calendar

- Month and agenda views
- Purple markers for paydays
- Pink/red markers for bill due dates
- Gold markers for savings contributions or milestones
- Selecting a payday shows income and every assigned deduction
- Selecting a bill shows its amount, due date, source paycheck, and edit action
- Keyboard shortcut toggles Dashboard and Calendar for the Raspberry Pi programmable button

### Savings goals

- Name, target amount, target date, starting balance, actual saved, priority, and active status
- Suggested periodic contribution based on remaining paydays
- "Should have saved" uses elapsed scheduled contributions
- "Remaining" is target minus actual saved, never below zero
- Actual savings is edited independently from planned savings
- Changes immediately update projections and paycheck allocations

### Background media

- Upload, preview, select, replace, or remove a photo or MP4
- Store user media in a private Supabase Storage bucket
- Enforce file type and size limits
- MP4 playback: autoplay, muted, loop, plays inline, no controls on dashboard
- Preserve a fallback solid royal-purple background
- Provide opacity/blur controls for readability

## Data model

- profiles
- household_settings
- income_sources
- paychecks
- bills
- bill_occurrences
- paycheck_allocations
- savings_goals
- savings_entries
- background_media

Every record carries an owner user ID where appropriate. Monetary values use fixed decimal or integer cents, never floating-point values.

## Calculation rules

- All money calculations use integer cents.
- Calculations are deterministic and testable.
- Remaining goal = max(target - actual, 0).
- Ahead/behind = actual - should-have-saved.
- Safe to use = combined paycheck - required bills - groceries/fuel - planned goal contributions - protected buffer.
- A negative safe-to-use amount triggers a warning and proposes reductions to flexible categories; it never hides the shortfall.
- Rounding differences are assigned to the later paycheck so monthly totals reconcile exactly.

## Reliability and safety

- Validate amounts, dates, recurrence, and file uploads.
- Confirm destructive actions such as deleting a bill or savings entry.
- Prefer archive over permanent deletion.
- Show saving, saved, offline, and error states.
- The PWA may cache the interface, but financial changes require confirmed Supabase persistence.
- Do not claim a save succeeded until Supabase confirms it.

## Testing

- Unit tests for payday generation, assignment, split funding, priority reductions, savings math, and rounding.
- Integration tests for Supabase reads/writes and row-level security.
- UI tests for adding/editing bills, changing actual pay, recording savings, uploading media, and calendar navigation.
- Responsive checks for phone, desktop, and Raspberry Pi landscape display.
- Accessibility checks for keyboard navigation, color contrast, reduced motion, and focus visibility.

## Initial seed data

Use the user's current household estimates as editable starting values:

- Brandon expected net pay: $1,532.88 biweekly
- Spouse expected net pay: $1,000.00 biweekly
- Combined expected payday: $2,532.88
- Rent: $1,500 due on the 1st
- Car: $400 due on the 11th
- T-Mobile: $160 around the 15th
- Aaron's: $140 due late month
- Other existing bills and goals from the budget workbook remain editable

## Repository documentation

- Keep README.md short: product name, one-paragraph purpose, setup commands, required environment-variable names, and deployment steps.
- Never include credentials, personal login details, secret keys, or financial data in the README.

## Out of scope for the first release

- Bank account syncing
- Credit-score retrieval
- Automatic bill payment
- Investment trading
- Multiple household members or shared editing
- Native iOS/Android app-store packages

The responsive PWA is installable from the browser and is the supported phone/Pi experience.
