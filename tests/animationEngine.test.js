import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROOM_ROUTE_POINTS,
  buildDoorAccurateRoute,
  calculateRouteDuration,
} from '../src/animationEngine.js';

test('routes from the entrance through the lobby and the exact top-room door', () => {
  const route = buildDoorAccurateRoute({ from: 'entrance', to: 'room-2' });
  assert.deepEqual(route[0], ROOM_ROUTE_POINTS.entrance);
  assert.ok(route.some((point) => point.id === 'lobby'));
  assert.ok(route.some((point) => point.id === 'hub'));
  assert.ok(route.some((point) => point.id === 'room-2-door'));
  assert.deepEqual(route.at(-1), ROOM_ROUTE_POINTS['room-2-inside']);
});

test('leaves the current room through its own door before crossing to another office', () => {
  const route = buildDoorAccurateRoute({ from: 'room-1', to: 'room-9' });
  const sourceDoorIndex = route.findIndex((point) => point.id === 'room-1-door');
  const hubIndex = route.findIndex((point) => point.id === 'hub');
  const targetDoorIndex = route.findIndex((point) => point.id === 'room-9-door');
  assert.ok(sourceDoorIndex > 0);
  assert.ok(hubIndex > sourceDoorIndex);
  assert.ok(targetDoorIndex > hubIndex);
  assert.deepEqual(route.at(-1), ROOM_ROUTE_POINTS['room-9-inside']);
});

test('routes the savings vault through the database-room door', () => {
  const route = buildDoorAccurateRoute({ from: 'room-6', to: 'savings-vault' });
  assert.ok(route.some((point) => point.id === 'room-6-door'));
  assert.ok(route.some((point) => point.id === 'vault-door'));
  assert.deepEqual(route.at(-1), ROOM_ROUTE_POINTS['vault-inside']);
});

test('dramatic timing grows with route distance and respects animation speed', () => {
  const shortRoute = [ROOM_ROUTE_POINTS.hub, ROOM_ROUTE_POINTS['room-3-door']];
  const longRoute = buildDoorAccurateRoute({ from: 'entrance', to: 'room-4' });
  assert.ok(calculateRouteDuration(longRoute, 1) > calculateRouteDuration(shortRoute, 1));
  assert.ok(calculateRouteDuration(longRoute, 2) < calculateRouteDuration(longRoute, 1));
  assert.ok(calculateRouteDuration(shortRoute, 1) >= 700);
});
