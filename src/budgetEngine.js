export const AUGUST_2026_BILLS = Object.freeze([
  { id: 'rent', name: 'Rent', dueDate: '2026-08-01', amountCents: 150_000, category: 'Housing', paidCents: 0, recurring: true },
  { id: 'car', name: 'Car', dueDate: '2026-08-11', amountCents: 36_200, category: 'Transportation', paidCents: 0, recurring: true },
  { id: 'phone', name: 'Phone', dueDate: '2026-08-13', amountCents: 14_280, category: 'Utilities', paidCents: 0, recurring: true },
  { id: 'insurance', name: 'Insurance', dueDate: '2026-08-18', amountCents: 20_000, category: 'Insurance', paidCents: 0, recurring: true },
  { id: 'gas', name: 'Gas', dueDate: '2026-08-18', amountCents: 10_000, category: 'Utilities', paidCents: 0, recurring: true },
  { id: 'fpl-extension', name: 'FPL Extension', dueDate: '2026-08-19', amountCents: 13_120, category: 'Utilities', paidCents: 0, recurring: false },
  { id: 'aaron', name: 'Aaron', dueDate: '2026-08-20', amountCents: 12_000, category: 'Personal', paidCents: 0, recurring: true },
  { id: 'fpl-regular', name: 'FPL Regular', dueDate: '2026-08-29', amountCents: 13_382, category: 'Utilities', paidCents: 0, recurring: true },
  { id: 'subscriptions', name: 'Subscriptions', dueDate: null, dueLabel: 'Recurring', amountCents: 10_000, category: 'Subscriptions', paidCents: 0, recurring: true },
]);


export const DEFAULT_SAVINGS_BOXES = Object.freeze([
  { id: 'house', name: 'House', targetCents: 0, savedCents: 0 },
  { id: 'emergency', name: 'Emergency', targetCents: 0, savedCents: 0 },
  { id: 'megacon', name: 'MegaCon', targetCents: 0, savedCents: 0 },
  { id: 'family-fun', name: 'Family Fun', targetCents: 0, savedCents: 0 },
  { id: 'future-goal', name: 'Future Goal', targetCents: 0, savedCents: 0 },
]);

export const DEFAULT_CHARACTER = Object.freeze({
  id: 'camille',
  name: 'Camille',
  skinTone: 'deep',
  hairstyle: 'locs',
  bodyStyle: 'average',
  shirtColor: '#7c3aed',
  pantsColor: '#2e1065',
  hairColor: '#1c120d',
});

export const PAYCHECK_START_DATE = '2026-08-07';
export const DEFAULT_PAYCHECK_COUNT = 6;

export function generateBiweeklyPaychecks(startDate = PAYCHECK_START_DATE, count = DEFAULT_PAYCHECK_COUNT) {
  const start = new Date(`${startDate}T12:00:00`);
  return Array.from({ length: count }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + (index * 14));
    const iso = next.toISOString().slice(0, 10);
    return { id: `paycheck-${iso}`, date: iso, amountCents: 0 };
  });
}

export function createInitialState() {
  return {
    version: 1,
    asOfDate: '2026-08-04',
    availableCents: 0,
    savings: {
      name: 'Savings Vault',
      boxes: DEFAULT_SAVINGS_BOXES.map((box) => ({ ...box })),
      targetCents: 0,
      savedCents: 0,
    },
    paychecks: generateBiweeklyPaychecks(),
    bills: AUGUST_2026_BILLS.map((bill) => ({ ...bill })),
    characters: [{ ...DEFAULT_CHARACTER }],
    selectedCharacterId: DEFAULT_CHARACTER.id,
    animationSpeed: 1,
  };
}

export function classifyBill(bill, asOfDate) {
  const outstanding = Math.max(0, bill.amountCents - (bill.paidCents || 0));
  if (outstanding === 0) return 'paid';
  if (!bill.dueDate) return 'recurring';
  if (bill.dueDate < asOfDate) return 'overdue';
  if (bill.dueDate === asOfDate) return 'due-today';
  return 'upcoming';
}

export function sortBillsForFunding(bills, asOfDate) {
  const rank = { overdue: 0, 'due-today': 1, upcoming: 2, recurring: 3, paid: 4 };
  return [...bills].sort((a, b) => {
    const stateDiff = rank[classifyBill(a, asOfDate)] - rank[classifyBill(b, asOfDate)];
    if (stateDiff !== 0) return stateDiff;
    const aDate = a.dueDate || '9999-12-31';
    const bDate = b.dueDate || '9999-12-31';
    if (aDate !== bDate) return aDate.localeCompare(bDate);
    return 0;
  });
}

export function allocateAvailableFunds(bills, availableCents, asOfDate) {
  let remainingCents = Math.max(0, Math.trunc(availableCents || 0));
  const allocations = sortBillsForFunding(bills, asOfDate).map((bill) => {
    const outstandingCents = Math.max(0, bill.amountCents - (bill.paidCents || 0));
    const fundedCents = Math.min(outstandingCents, remainingCents);
    remainingCents -= fundedCents;
    return {
      billId: bill.id,
      name: bill.name,
      dueDate: bill.dueDate,
      dueLabel: bill.dueLabel,
      amountCents: bill.amountCents,
      outstandingCents,
      fundedCents,
      status: outstandingCents === 0 ? 'paid' : fundedCents >= outstandingCents ? 'funded' : fundedCents > 0 ? 'partial' : classifyBill(bill, asOfDate),
    };
  });

  return { allocations, remainingCents };
}

export function summarizeBills(bills, asOfDate) {
  return bills.reduce((summary, bill) => {
    const outstandingCents = Math.max(0, bill.amountCents - (bill.paidCents || 0));
    summary.totalCents += bill.amountCents;
    summary.paidCents += Math.min(bill.amountCents, bill.paidCents || 0);
    summary.outstandingCents += outstandingCents;
    const status = classifyBill(bill, asOfDate);
    if (status === 'overdue') summary.overdueCents += outstandingCents;
    if (status === 'upcoming' || status === 'due-today' || status === 'recurring') summary.remainingCents += outstandingCents;
    return summary;
  }, { totalCents: 0, paidCents: 0, outstandingCents: 0, overdueCents: 0, remainingCents: 0 });
}


export function summarizeSavingsBoxes(boxes = []) {
  const totals = boxes.reduce((summary, box) => {
    summary.targetCents += Math.max(0, Math.trunc(box.targetCents || 0));
    summary.savedCents += Math.max(0, Math.trunc(box.savedCents || 0));
    return summary;
  }, { targetCents: 0, savedCents: 0 });
  const remainingCents = Math.max(totals.targetCents - totals.savedCents, 0);
  const progress = totals.targetCents > 0
    ? Math.min(100, Math.round((totals.savedCents / totals.targetCents) * 100))
    : totals.savedCents > 0 ? 100 : 0;
  return { ...totals, remainingCents, progress };
}

export function buildBankStops(allocations, savings) {
  const stops = [{ destinationId: 'entrance', kind: 'entrance', amountCents: 0 }];
  for (const allocation of allocations) {
    if (allocation.status === 'paid') continue;
    stops.push({
      destinationId: allocation.billId,
      kind: 'bill',
      amountCents: allocation.fundedCents,
      label: allocation.name,
      status: allocation.status,
    });
  }
  if (savings && (savings.targetCents > 0 || savings.savedCents > 0)) {
    stops.push({
      destinationId: 'savings-vault',
      kind: 'savings',
      amountCents: savings.savedCents,
      label: 'Savings Vault',
      status: savings.targetCents > 0 && savings.savedCents >= savings.targetCents ? 'funded' : 'saving',
    });
  }
  stops.push({ destinationId: 'exit', kind: 'exit', amountCents: 0 });
  return stops;
}


export function normalizePaychecks(paychecks = [], startDate = PAYCHECK_START_DATE, count = DEFAULT_PAYCHECK_COUNT) {
  const generated = generateBiweeklyPaychecks(startDate, count);
  return generated.map((base, index) => ({
    ...base,
    ...(paychecks[index] || {}),
    id: (paychecks[index] && paychecks[index].id) || base.id,
    date: (paychecks[index] && paychecks[index].date) || base.date,
    amountCents: Math.max(0, Math.trunc((paychecks[index] && paychecks[index].amountCents) || 0)),
  }));
}

export function assignBillToClosestPaycheck(bill, paychecks) {
  const ordered = normalizePaychecks(paychecks).slice().sort((a, b) => a.date.localeCompare(b.date));
  if (!ordered.length) return null;
  if (!bill.dueDate) return ordered[0];
  const due = new Date(`${bill.dueDate}T12:00:00`);
  let best = ordered[0];
  let bestDistance = Math.abs(dayDiff(due, new Date(`${best.date}T12:00:00`)));
  for (const paycheck of ordered.slice(1)) {
    const distance = Math.abs(dayDiff(due, new Date(`${paycheck.date}T12:00:00`)));
    if (distance < bestDistance) {
      best = paycheck;
      bestDistance = distance;
      continue;
    }
    if (distance === bestDistance && paycheck.date < best.date) {
      best = paycheck;
      bestDistance = distance;
    }
  }
  return best;
}

export function routeBillsToPaychecks(bills, paychecks) {
  const normalized = normalizePaychecks(paychecks);
  const buckets = normalized.map((paycheck) => ({
    ...paycheck,
    bills: [],
    assignedCents: 0,
    remainingCents: paycheck.amountCents,
    shortageCents: 0,
  }));
  const lookup = new Map(buckets.map((paycheck) => [paycheck.id, paycheck]));
  const assignments = new Map();
  for (const bill of bills) {
    const paycheck = assignBillToClosestPaycheck(bill, normalized);
    if (!paycheck) continue;
    const bucket = lookup.get(paycheck.id);
    const outstandingCents = Math.max(0, bill.amountCents - (bill.paidCents || 0));
    const assignedBill = { ...bill, outstandingCents };
    bucket.bills.push(assignedBill);
    bucket.assignedCents += outstandingCents;
    bucket.remainingCents = bucket.amountCents - bucket.assignedCents;
    bucket.shortageCents = Math.max(0, -bucket.remainingCents);
    assignments.set(bill.id, paycheck);
  }
  return { paychecks: buckets, assignments };
}

function dayDiff(a, b) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

export function formatMoney(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((Number(cents) || 0) / 100);
}

export function parseMoneyToCents(value) {
  const normalized = String(value ?? '').replace(/[$,\s]/g, '');
  if (!/^\d*(?:\.\d{0,2})?$/.test(normalized) || normalized === '') return null;
  const [whole = '0', fraction = ''] = normalized.split('.');
  return Number.parseInt(whole, 10) * 100 + Number.parseInt((fraction + '00').slice(0, 2), 10);
}

export function toSlug(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `bill-${Date.now()}`;
}
