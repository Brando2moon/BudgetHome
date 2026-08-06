const point = (id, x, y) => Object.freeze({ id, x, y });

export const ROOM_ROUTE_POINTS = Object.freeze({
  entrance: point('entrance', 49.6, 88.2),
  exit: point('exit', 52.3, 88.2),
  lobby: point('lobby', 49.6, 78.5),
  hub: point('hub', 49.6, 52.2),
  'top-hall': point('top-hall', 49.6, 37.2),
  'left-hall': point('left-hall', 34.2, 52.2),
  'right-hall': point('right-hall', 71.8, 52.2),
  'room-1-door': point('room-1-door', 28.8, 29.2),
  'room-1-inside': point('room-1-inside', 22.8, 25.0),
  'room-2-door': point('room-2-door', 39.8, 36.8),
  'room-2-inside': point('room-2-inside', 39.8, 26.0),
  'room-3-door': point('room-3-door', 62.0, 36.8),
  'room-3-inside': point('room-3-inside', 62.0, 26.0),
  'room-4-door': point('room-4-door', 74.2, 29.0),
  'room-4-inside': point('room-4-inside', 82.4, 25.0),
  'room-5-door': point('room-5-door', 29.5, 51.8),
  'room-5-inside': point('room-5-inside', 21.2, 57.2),
  'room-6-door': point('room-6-door', 29.5, 62.0),
  'room-6-inside': point('room-6-inside', 21.2, 66.0),
  'room-7-door': point('room-7-door', 53.0, 51.8),
  'room-7-inside': point('room-7-inside', 59.2, 57.0),
  'room-8-door': point('room-8-door', 53.0, 63.0),
  'room-8-inside': point('room-8-inside', 65.0, 65.0),
  'room-9-door': point('room-9-door', 75.0, 58.0),
  'room-9-inside': point('room-9-inside', 85.0, 58.0),
  'vault-door': point('vault-door', 74.2, 29.0),
  'vault-inside': point('vault-inside', 84.5, 22.5),
});

const ROOM_GROUPS = Object.freeze({
  'room-1': 'top-left',
  'room-2': 'top',
  'room-3': 'top',
  'room-4': 'top-right',
  'room-5': 'lower-left',
  'room-6': 'lower-left',
  'room-7': 'lower-right',
  'room-8': 'lower-right',
  'room-9': 'far-right',
  'savings-vault': 'top-right',
});

function addUnique(route, routePoint) {
  if (!routePoint) return;
  if (route.at(-1)?.id !== routePoint.id) route.push(routePoint);
}

function routeFromLocation(route, from) {
  if (from === 'entrance' || from === 'exit') {
    addUnique(route, ROOM_ROUTE_POINTS[from]);
    addUnique(route, ROOM_ROUTE_POINTS.lobby);
    addUnique(route, ROOM_ROUTE_POINTS.hub);
    return;
  }
  if (from === 'savings-vault') {
    addUnique(route, ROOM_ROUTE_POINTS['vault-inside']);
    addUnique(route, ROOM_ROUTE_POINTS['vault-door']);
    addUnique(route, ROOM_ROUTE_POINTS['top-hall']);
    addUnique(route, ROOM_ROUTE_POINTS.hub);
    return;
  }
  if (ROOM_GROUPS[from]) {
    addUnique(route, ROOM_ROUTE_POINTS[`${from}-inside`]);
    addUnique(route, ROOM_ROUTE_POINTS[`${from}-door`]);
    const group = ROOM_GROUPS[from];
    if (group.startsWith('top')) addUnique(route, ROOM_ROUTE_POINTS['top-hall']);
    if (group === 'lower-left') addUnique(route, ROOM_ROUTE_POINTS['left-hall']);
    if (group === 'lower-right' || group === 'far-right') addUnique(route, ROOM_ROUTE_POINTS['right-hall']);
    addUnique(route, ROOM_ROUTE_POINTS.hub);
    return;
  }
  addUnique(route, ROOM_ROUTE_POINTS.hub);
}

function routeToLocation(route, to) {
  if (to === 'entrance' || to === 'exit') {
    addUnique(route, ROOM_ROUTE_POINTS.lobby);
    addUnique(route, ROOM_ROUTE_POINTS[to]);
    return;
  }
  if (to === 'savings-vault') {
    addUnique(route, ROOM_ROUTE_POINTS['top-hall']);
    addUnique(route, ROOM_ROUTE_POINTS['vault-door']);
    addUnique(route, ROOM_ROUTE_POINTS['vault-inside']);
    return;
  }
  const group = ROOM_GROUPS[to];
  if (!group) return;
  if (group.startsWith('top')) addUnique(route, ROOM_ROUTE_POINTS['top-hall']);
  if (group === 'lower-left') addUnique(route, ROOM_ROUTE_POINTS['left-hall']);
  if (group === 'lower-right' || group === 'far-right') addUnique(route, ROOM_ROUTE_POINTS['right-hall']);
  addUnique(route, ROOM_ROUTE_POINTS[`${to}-door`]);
  addUnique(route, ROOM_ROUTE_POINTS[`${to}-inside`]);
}

export function buildDoorAccurateRoute({ from = 'entrance', to = 'entrance' } = {}) {
  const route = [];
  routeFromLocation(route, from);
  routeToLocation(route, to);
  return route;
}

export function routeDistance(route = []) {
  let distance = 0;
  for (let index = 1; index < route.length; index += 1) {
    distance += Math.hypot(route[index].x - route[index - 1].x, route[index].y - route[index - 1].y);
  }
  return distance;
}

export function calculateRouteDuration(route = [], speed = 1) {
  const safeSpeed = Math.max(0.4, Number(speed) || 1);
  return Math.max(700, Math.round((650 + routeDistance(route) * 24) / safeSpeed));
}

export function keyframesForRoute(route = []) {
  if (!route.length) return [];
  const total = Math.max(routeDistance(route), 1);
  let traveled = 0;
  return route.map((routePoint, index) => {
    if (index > 0) traveled += Math.hypot(routePoint.x - route[index - 1].x, routePoint.y - route[index - 1].y);
    return {
      left: `${routePoint.x}%`,
      top: `${routePoint.y}%`,
      offset: index === route.length - 1 ? 1 : traveled / total,
    };
  });
}
