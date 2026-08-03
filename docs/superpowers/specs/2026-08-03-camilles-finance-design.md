# Camille's Finance — Design

Private personal budgeting PWA for one household administrator.

## Experience

- Login is required before any financial screen.
- Royal-purple and gold pixel-art bank is the main dashboard.
- Responsive on phone, desktop, and Raspberry Pi landscape.
- Other pages remain simple forms and tables for editing accounts, bills, paychecks, goals, characters, and settings.
- Optional user-uploaded photo or muted looping MP4 background remains available behind readable surfaces.

## Living bank dashboard

- The dashboard is a top-down animated bank with rooms representing active bill categories.
- Each bill room displays its live amount, due date, assigned paycheck, and funded, pending, or overdue status.
- The Savings Vault displays total savings and contains safety-deposit boxes for House, Emergency, MegaCon, Family Fun, and future goals.
- Black pixel characters enter carrying the selected paycheck, walk to funded bill rooms, deposit the planned amount, visit the vault for savings allocations, then exit.
- The journey continuously replays without audio.
- Editing a paycheck, bill, due date, assignment, split, savings entry, goal, or character recalculates the plan and changes the next animation loop automatically.
- When values are invalid or saving fails, the last valid plan remains visible and the editor shows an actionable error.
- Reduced-motion mode replaces walking with short fades and room highlights.

## Character editor

- Create, rename, edit, activate, and archive several family characters.
- Preset controls: Black skin-tone options, hairstyle, hair color, shirt color, pants color, and body style.
- Show a walking preview before saving.
- Choose which active characters appear in the bank.
- Character selections persist in Supabase and update the next dashboard loop.
- Version one uses presets only; no pixel-by-pixel drawing or image uploads.

## Budgeting

- Store two editable income sources and generate biweekly paydays.
- Record exact actual income for each payday.
- Add, edit, pause, and archive recurring or one-time bills.
- Show paydays and bill due dates on the calendar.
- Assign each bill to the latest safe paycheck before its due date.
- Split a bill across two preceding paychecks when one paycheck would be overloaded.
- Allow manual assignment overrides.
- Protect essentials before groceries, buffer, savings goals, and entertainment.
- Recalculate future allocations when income, dates, bills, or goals change.
- Completed historical allocations remain unchanged.

## Savings display

Show goal, should-have-saved, actually saved, remaining, progress, and ahead/behind.

- Remaining = max(goal - actual saved, 0)
- Ahead/behind = actual saved - should-have-saved

## Architecture and data

- React, TypeScript, Vite, and a deterministic integer-cent budget engine.
- A bank-scene model converts each paycheck plan into ordered character stops; rendering and animation never perform financial calculations.
- Supabase Auth with one pre-created account and public registration disabled.
- Supabase Postgres stores owner-scoped budget records, scene preferences, and character presets.
- Supabase Storage holds optional background media.
- Row-level security protects every financial record, character record, setting, and private media object.
- Credentials and financial data never appear in source code or README.

## Testing and acceptance

- Unit tests cover payday generation, bill assignment, splitting, savings math, and conversion from plan to bank route.
- Component tests cover editors, live scene refresh, character preview, login protection, and error states.
- End-to-end tests cover editing income and bills, observing the next loop change, character customization, calendar markers, media backgrounds, and Raspberry Pi display.
- The bank loop must remain readable and usable when animation is paused or reduced motion is enabled.

## Repository

Keep README.md short: name, purpose, setup, environment-variable names, and deployment commands.

## First-release exclusions

No bank syncing, automatic payments, credit-score retrieval, investments, multi-user sharing, freehand character drawing, or uploaded character sprites.
