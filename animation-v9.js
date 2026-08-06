import {
  ROOM_ROUTE_POINTS,
  buildDoorAccurateRoute,
  calculateRouteDuration,
  keyframesForRoute,
  routeDistance,
} from './src/animationEngine.js';

const SKIN_TONES = { deep: '#3b2118', dark: '#563122', brown: '#75462f', warm: '#925f40' };
const DEFAULT_ACTORS = [
  { skinTone: 'dark', hairstyle: 'bun', bodyStyle: 'curvy', hairColor: '#25120b', shirtColor: '#b45309', pantsColor: '#5b21b6', role: 'staff' },
  { skinTone: 'brown', hairstyle: 'fade', bodyStyle: 'broad', hairColor: '#140b08', shirtColor: '#0f766e', pantsColor: '#312e81', role: 'customer' },
  { skinTone: 'warm', hairstyle: 'curls', bodyStyle: 'slim', hairColor: '#1f120d', shirtColor: '#be185d', pantsColor: '#4338ca', role: 'customer' },
];
const AMBIENT_ROUTES = [
  ['entrance', 'room-1', 'room-5', 'room-9', 'exit'],
  ['entrance', 'room-2', 'room-7', 'room-9', 'exit'],
  ['entrance', 'room-3', 'savings-vault', 'room-9', 'exit'],
];

let currentLocation = 'entrance';
let mainRunId = 0;
let mainAnimation = null;
let lastDestination = null;
let ambientActors = [];
let observer = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function actorMarkup() {
  return `<span class="pixel hair"></span><span class="pixel head"></span>
    <span class="pixel eye left-eye"></span><span class="pixel eye right-eye"></span>
    <span class="pixel nose"></span><span class="pixel mouth"></span>
    <span class="pixel body"></span><span class="pixel left-arm"></span><span class="pixel right-arm"></span>
    <span class="pixel left-leg"></span><span class="pixel right-leg"></span>
    <span class="actor-money-bag" aria-hidden="true">$</span>`;
}

function ensureLayers() {
  const scene = $('#bank-scene');
  if (!scene) return false;
  for (const [id, className, live] of [
    ['route-fx-layer', 'route-fx-layer', false],
    ['ambient-actors', 'ambient-actors', false],
    ['event-burst', 'event-burst', true],
  ]) {
    if ($(`#${id}`)) continue;
    const node = document.createElement('div');
    node.id = id;
    node.className = className;
    node.setAttribute(live ? 'aria-live' : 'aria-hidden', live ? 'polite' : 'true');
    scene.append(node);
  }
  const main = $('#pixel-character');
  if (main) {
    main.classList.add('scene-actor');
    if (!main.querySelector('.actor-money-bag')) main.insertAdjacentHTML('beforeend', '<span class="actor-money-bag" aria-hidden="true">$</span>');
  }
  return true;
}

function roomDestination(node) {
  if (!node) return null;
  if (['entrance', 'exit', 'savings-vault'].includes(node.dataset.roomId)) return node.dataset.roomId;
  const index = $$('.bank-room').indexOf(node);
  return index >= 0 ? `room-${index + 1}` : null;
}

function activeDestination() {
  return roomDestination($('.bank-room.active, .bank-vault.active, .bank-door.active'));
}

function speedValue() {
  return Math.max(0.6, Number($('#animation-speed')?.value) || 1);
}

function isPaused() {
  return $('#pause-animation')?.getAttribute('aria-pressed') === 'true' || document.hidden;
}

async function routeMainCharacter(destination) {
  if (!destination || destination === lastDestination || isPaused()) return;
  lastDestination = destination;
  mainRunId += 1;
  const runId = mainRunId;
  mainAnimation?.cancel();
  const main = $('#pixel-character');
  if (!main) return;
  const route = buildDoorAccurateRoute({ from: currentLocation, to: destination });
  const duration = Math.min(1500, Math.max(760, calculateRouteDuration(route, speedValue()) * 0.68));
  main.classList.add('walking', 'dramatic-run');
  const completed = await animateActorRoute(main, route, duration, {
    isCancelled: () => runId !== mainRunId || isPaused(),
    onAnimation: (animation) => { mainAnimation = animation; },
    flashDoors: true,
  });
  mainAnimation = null;
  if (!completed || runId !== mainRunId) return;
  currentLocation = destination;
  main.classList.remove('walking', 'dramatic-run');
  main.classList.add('arrival-pop');
  setTimeout(() => main.classList.remove('arrival-pop'), 520);
  const point = route.at(-1);
  showEvent(point);
  spawnDepositParticles(point);
  sceneImpact(destination === 'savings-vault');
}

async function animateActorRoute(node, route, durationMs, options = {}) {
  if (!node || route.length < 1) return false;
  const { isCancelled = () => false, onAnimation = () => {}, flashDoors = false } = options;
  node.getAnimations().forEach((animation) => animation.cancel());
  const frames = keyframesForRoute(route);
  const total = Math.max(routeDistance(route), 1);
  node.style.left = frames[0].left;
  node.style.top = frames[0].top;
  for (let index = 1; index < route.length; index += 1) {
    if (isCancelled()) return false;
    const previous = route[index - 1];
    const current = route[index];
    const segmentDistance = Math.hypot(current.x - previous.x, current.y - previous.y);
    const segmentDuration = Math.max(100, Math.round(durationMs * segmentDistance / total));
    node.style.setProperty('--facing', current.x < previous.x ? '-1' : '1');
    const animation = node.animate([
      { left: `${previous.x}%`, top: `${previous.y}%` },
      { left: `${current.x}%`, top: `${current.y}%` },
    ], {
      duration: segmentDuration,
      easing: current.id.includes('door') ? 'cubic-bezier(.32,.04,.28,1)' : 'linear',
      fill: 'forwards',
    });
    onAnimation(animation);
    try { await animation.finished; } catch { return false; }
    node.style.left = `${current.x}%`;
    node.style.top = `${current.y}%`;
    if (flashDoors && current.id.includes('door')) flashDoor(current);
  }
  return !isCancelled();
}

function flashDoor(point) {
  const layer = $('#route-fx-layer');
  if (!layer || !point) return;
  const flash = document.createElement('span');
  flash.className = 'door-flash';
  flash.style.left = `${point.x}%`;
  flash.style.top = `${point.y}%`;
  layer.append(flash);
  setTimeout(() => flash.remove(), 720);
}

function showEvent(point) {
  const burst = $('#event-burst');
  if (!burst || !point) return;
  const message = $('#thought-bubble')?.textContent?.trim() || 'Deposit route updated';
  burst.textContent = message.replace('Depositing ', '+').replace(' into ', ' → ').toUpperCase();
  burst.style.left = `${point.x}%`;
  burst.style.top = `${Math.max(7, point.y - 3)}%`;
  burst.classList.remove('show');
  void burst.offsetWidth;
  burst.classList.add('show');
  setTimeout(() => burst.classList.remove('show'), 1500);
}

function spawnDepositParticles(point) {
  if (!point) return;
  const layer = $('#route-fx-layer');
  const message = $('#thought-bubble')?.textContent || '';
  if (!layer || /Entering|complete/i.test(message)) return;
  const count = /Vault/i.test(message) ? 14 : 10;
  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement('span');
    particle.className = `coin-particle ${/Vault/i.test(message) ? 'vault-coin' : ''}`;
    particle.textContent = index % 3 === 0 ? '$' : '•';
    const angle = Math.PI * 2 * index / count;
    const distance = 24 + (index % 4) * 10;
    particle.style.left = `${point.x}%`;
    particle.style.top = `${point.y}%`;
    particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--dy', `${Math.sin(angle) * distance - 22}px`);
    particle.style.setProperty('--delay', `${index * 28}ms`);
    layer.append(particle);
    setTimeout(() => particle.remove(), 1350);
  }
}

function sceneImpact(vault = false) {
  const scene = $('#bank-scene');
  if (!scene) return;
  scene.classList.remove('scene-impact', 'vault-impact');
  void scene.offsetWidth;
  scene.classList.add('scene-impact');
  if (vault) scene.classList.add('vault-impact');
  setTimeout(() => scene.classList.remove('scene-impact', 'vault-impact'), 620);
}

function applyCharacter(node, character) {
  node.style.setProperty('--skin', SKIN_TONES[character.skinTone] || SKIN_TONES.deep);
  node.style.setProperty('--hair', character.hairColor);
  node.style.setProperty('--shirt', character.shirtColor);
  node.style.setProperty('--pants', character.pantsColor);
  node.dataset.hairStyle = character.hairstyle;
  node.dataset.bodyStyle = character.bodyStyle;
}

function createAmbientActors() {
  const layer = $('#ambient-actors');
  if (!layer || ambientActors.length) return;
  ambientActors = DEFAULT_ACTORS.map((character, index) => {
    const node = document.createElement('div');
    node.className = 'pixel-character ambient-actor';
    node.dataset.actorRole = character.role;
    node.innerHTML = actorMarkup();
    node.style.left = `${ROOM_ROUTE_POINTS.entrance.x}%`;
    node.style.top = `${ROOM_ROUTE_POINTS.entrance.y}%`;
    node.style.setProperty('--actor-scale', character.role === 'staff' ? '.74' : '.68');
    applyCharacter(node, character);
    layer.append(node);
    return { node, route: AMBIENT_ROUTES[index], index: 0, location: 'entrance', runId: 0, timer: null, active: false };
  });
}

function startAmbientActors() {
  createAmbientActors();
  ambientActors.forEach((actor, index) => {
    if (actor.active || actor.timer) return;
    actor.timer = setTimeout(() => { actor.timer = null; void moveAmbientActor(actor); }, 500 + index * 620);
  });
}

async function moveAmbientActor(actor) {
  if (isPaused() || actor.active) return;
  actor.active = true;
  actor.runId += 1;
  const runId = actor.runId;
  const next = actor.route[(actor.index + 1) % actor.route.length];
  const route = buildDoorAccurateRoute({ from: actor.location, to: next });
  actor.node.classList.add('walking');
  const completed = await animateActorRoute(actor.node, route, calculateRouteDuration(route, speedValue()) * 1.12, {
    isCancelled: () => runId !== actor.runId || isPaused(),
  });
  actor.node.classList.remove('walking');
  actor.active = false;
  if (!completed || runId !== actor.runId) return;
  actor.location = next;
  actor.index = (actor.index + 1) % actor.route.length;
  actor.timer = setTimeout(() => { actor.timer = null; void moveAmbientActor(actor); }, 900 + actor.index * 110);
}

function stopAnimations() {
  mainRunId += 1;
  mainAnimation?.cancel();
  mainAnimation = null;
  ambientActors.forEach((actor) => {
    actor.runId += 1;
    actor.active = false;
    clearTimeout(actor.timer);
    actor.timer = null;
    actor.node.getAnimations().forEach((animation) => animation.cancel());
    actor.node.classList.remove('walking');
  });
}

function observeBank() {
  const scene = $('#bank-scene');
  if (!scene) return;
  observer?.disconnect();
  observer = new MutationObserver(() => {
    if (isPaused()) return;
    const destination = activeDestination();
    if (destination) void routeMainCharacter(destination);
  });
  observer.observe(scene, { subtree: true, attributes: true, attributeFilter: ['class'] });
  $('#pause-animation')?.addEventListener('click', () => setTimeout(() => {
    if (isPaused()) stopAnimations();
    else {
      lastDestination = null;
      startAmbientActors();
      const destination = activeDestination();
      if (destination) void routeMainCharacter(destination);
    }
  }, 0));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAnimations(); else startAmbientActors();
  });
}

function boot() {
  if (!ensureLayers()) return setTimeout(boot, 100);
  createAmbientActors();
  observeBank();
  startAmbientActors();
  const destination = activeDestination();
  if (destination) void routeMainCharacter(destination);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
