# Camille's Finance — Design

Private personal budgeting PWA for one household administrator.

## Experience

- Login required before any financial screen.
- Royal-purple and gold dashboard.
- Responsive on phone, desktop, and Raspberry Pi.
- User-uploaded photo or muted looping MP4 background with readable frosted cards.
- Dashboard, accounts, bills, calendar, savings goals, and settings.

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

## Savings display

Show goal, should-have-saved, actually saved, remaining, progress, and ahead/behind.

- Remaining = max(goal - actual saved, 0)
- Ahead/behind = actual saved - should-have-saved

## Data and privacy

- Supabase Auth with one pre-created account and no public registration.
- Supabase Postgres for budget data and Storage for background media.
- Row-level security protects every financial record and private media object.
- Credentials and financial data never appear in source code or README.
- Money calculations use integer cents.

## Repository

Keep README.md short: name, purpose, setup, environment-variable names, and deployment commands.

## First-release exclusions

No bank syncing, automatic payments, credit-score retrieval, investments, or multi-user sharing.
