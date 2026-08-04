# Camille's Finance Bank

A self-contained household budgeting app that turns bills into animated pixel-bank departments. Your character continuously walks the bank route, showing which bills are overdue, funded, partially funded, or still waiting for money.

## Run

Open `index.html` with a local web server. For example:

```bash
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

## Test

```bash
npm test
npm run verify
```

## Data

The app starts with the supplied August 2026 bills and stores edits in the browser's `localStorage`. Use **Settings → Export budget backup** to save a JSON backup.
