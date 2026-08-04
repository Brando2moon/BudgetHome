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

export function createInitialState() {
  return {
    version: 1,
    asOfDate: '2026-08-04',
    availableCents: 0,
    savings: { name: 'Savings Vault', targetCents: 0, savedCents: 0 },
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
