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
