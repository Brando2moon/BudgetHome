import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('forces production navigations to refresh instead of serving the old bank shell', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /camilles-finance-v7/);
  assert.match(worker, /event\.request\.mode\s*===\s*['"]navigate['"]/);
  assert.match(worker, /fetch\(event\.request,\s*\{\s*cache:\s*['"]no-store['"]/);
});

test('publishes a one-click cache reset page for release 7', async () => {
  const workflow = await read('.github/workflows/deploy-pages.yml');
  assert.match(workflow, /refresh\.html/);
  const refresh = await read('refresh.html');
  assert.match(refresh, /caches\.keys\(\)/);
  assert.match(refresh, /navigator\.serviceWorker\.getRegistrations\(\)/);
  assert.match(refresh, /location\.replace\(['"]\.\/\?release=7['"]\)/);
});
