import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUGUST_2026_BILLS,
  allocateAvailableFunds,
  buildBankStops,
  classifyBill,
  createInitialState,
  formatMoney,
  summarizeBills,
  summarizeSavingsBoxes,
  generateBiweeklyPaychecks,
  assignBillToClosestPaycheck,
  routeBillsToPaychecks,
} from '../src/budgetEngine.js';

test('seeds the exact August bills and totals $2,789.82', () => {
  const state = createInitialState();
  assert.equal(state.bills.length, 9);
  assert.deepEqual(state.bills.map((bill) => bill.name), [
    'Rent', 'Car', 'Phone', 'Insurance', 'Gas', 'FPL Extension',
    'Aaron', 'FPL Regular', 'Subscriptions',
  ]);
  assert.equal(summarizeBills(state.bills, '2026-08-04').totalCents, 278_982);
});

test('marks rent overdue on August 4 while later dated bills remain upcoming', () => {
  const rent = AUGUST_2026_BILLS.find((bill) => bill.name === 'Rent');
  const car = AUGUST_2026_BILLS.find((bill) => bill.name === 'Car');
  assert.equal(classifyBill(rent, '2026-08-04'), 'overdue');
  assert.equal(classifyBill(car, '2026-08-04'), 'upcoming');
});

test('puts recurring bills after dated bills and allocates overdue bills first', () => {
  const result = allocateAvailableFunds(AUGUST_2026_BILLS, 170_000, '2026-08-04');
  assert.equal(result.allocations[0].billId, 'rent');
  assert.equal(result.allocations[0].fundedCents, 150_000);
  assert.equal(result.allocations[1].billId, 'car');
  assert.equal(result.allocations[1].fundedCents, 20_000);
  assert.equal(result.remainingCents, 0);
  assert.equal(result.allocations.at(-1).billId, 'subscriptions');
});

test('builds a continuous bank route with entrance, bill rooms, vault, and exit', () => {
  const result = allocateAvailableFunds(AUGUST_2026_BILLS, 200_000, '2026-08-04');
  const stops = buildBankStops(result.allocations, { targetCents: 50_000, savedCents: 10_000 });
  assert.equal(stops[0].destinationId, 'entrance');
  assert.ok(stops.some((stop) => stop.destinationId === 'rent'));
  assert.ok(stops.some((stop) => stop.destinationId === 'savings-vault'));
  assert.equal(stops.at(-1).destinationId, 'exit');
});

test('formats cents without floating-point drift', () => {
  assert.equal(formatMoney(14280), '$142.80');
  assert.equal(formatMoney(13382), '$133.82');
});

test('preserves the supplied order when two bills share a due date', () => {
  const result = allocateAvailableFunds(AUGUST_2026_BILLS, 0, '2026-08-04');
  const names = result.allocations.map((item) => item.name);
  assert.ok(names.indexOf('Insurance') < names.indexOf('Gas'));
});

test('creates the approved five safety-deposit boxes inside the savings vault', () => {
  const state = createInitialState();
  assert.deepEqual(state.savings.boxes.map((box) => box.name), [
    'House', 'Emergency', 'MegaCon', 'Family Fun', 'Future Goal',
  ]);
});

test('summarizes savings from the individual safety-deposit boxes', () => {
  const summary = summarizeSavingsBoxes([
    { name: 'House', targetCents: 100_000, savedCents: 25_000 },
    { name: 'Emergency', targetCents: 50_000, savedCents: 10_000 },
  ]);
  assert.deepEqual(summary, {
    targetCents: 150_000,
    savedCents: 35_000,
    remainingCents: 115_000,
    progress: 23,
  });
});

test('creates biweekly paychecks starting on Friday August 7, 2026', () => {
  const paychecks = generateBiweeklyPaychecks('2026-08-07', 4);
  assert.deepEqual(paychecks.map((paycheck) => paycheck.date), [
    '2026-08-07', '2026-08-21', '2026-09-04', '2026-09-18',
  ]);
});

test('assigns a bill to the closest paycheck date', () => {
  const paychecks = generateBiweeklyPaychecks('2026-08-07', 4);
  const bill = { id: 'insurance', name: 'Insurance', dueDate: '2026-08-18', amountCents: 20_000, paidCents: 0 };
  assert.equal(assignBillToClosestPaycheck(bill, paychecks).date, '2026-08-21');
});

test('routes bills into paycheck buckets and reports shortages', () => {
  const paychecks = generateBiweeklyPaychecks('2026-08-07', 2);
  paychecks[0].amountCents = 50_000;
  paychecks[1].amountCents = 20_000;
  const { paychecks: buckets } = routeBillsToPaychecks([
    { id: 'car', name: 'Car', dueDate: '2026-08-11', amountCents: 36_200, paidCents: 0 },
    { id: 'insurance', name: 'Insurance', dueDate: '2026-08-18', amountCents: 20_000, paidCents: 0 },
    { id: 'gas', name: 'Gas', dueDate: '2026-08-18', amountCents: 10_000, paidCents: 0 },
  ], paychecks);
  assert.equal(buckets[0].assignedCents, 36_200);
  assert.equal(buckets[0].remainingCents, 13_800);
  assert.equal(buckets[1].assignedCents, 30_000);
  assert.equal(buckets[1].shortageCents, 10_000);
});
