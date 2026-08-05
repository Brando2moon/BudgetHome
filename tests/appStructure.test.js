import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const readAppSource = async () => (await Promise.all([
  read('app-source-1.txt'), read('app-source-2.txt'), read('app-source-3.txt'),
])).join('');

test('ships the bank, bills, characters, and settings views', async () => {
  const html = await read('index.html');
  assert.match(html, /Camille's Finance Bank/);
  assert.match(html, /data-view="bank"/);
  assert.match(html, /data-view="bills"/);
  assert.match(html, /data-view="characters"/);
  assert.match(html, /data-view="settings"/);
});

test('includes accessible controls for funding and bill editing', async () => {
  const html = await read('index.html');
  assert.match(html, /id="available-funds"/);
  assert.match(html, /id="bill-form"/);
  assert.match(html, /id="character-form"/);
  assert.match(html, /id="pause-animation"/);
});

test('registers local persistence and a continuous animation loop', async () => {
  const source = await readAppSource();
  assert.match(source, /localStorage/);
  assert.match(source, /setTimeout/);
  assert.match(source, /buildBankStops/);
});

test('registers the current offline service worker', async () => {
  const source = await readAppSource();
  assert.match(source, /serviceWorker/);
  assert.match(await read('service-worker.js'), /camilles-finance-v6/);
});

test('renders the bank, vault, furnished offices, and facial features', async () => {
  const html = await read('index.html');
  const source = await readAppSource();
  const referenceStyles = await read('reference-theme.css');
  assert.match(html, /class="bank-building"/);
  assert.match(html, /id="bank-vault"/);
  assert.match(html, /id="vault-box-editor"/);
  assert.match(html, /class="pixel eye left-eye"/);
  assert.match(html, /class="pixel nose"/);
  assert.match(html, /class="pixel mouth"/);
  assert.match(source, /renderVaultBoxEditor/);
  assert.match(source, /room-stage/);
  assert.match(referenceStyles, /\.bank-room::before/);
  assert.match(referenceStyles, /\.bank-room::after/);
});

test('ships the 4K-ready bank art and paycheck planner', async () => {
  const html = await read('index.html');
  const source = await readAppSource();
  const loader = await read('app.js');
  assert.match(html, /id="bank-reference-art"/);
  assert.match(html, /data-bank-art-parts="20"/);
  assert.match(html, /id="paycheck-editor"/);
  assert.match(html, /id="save-paychecks"/);
  assert.match(source, /renderPaychecks/);
  assert.match(source, /routeBillsToPaychecks/);
  assert.match(source, /loadBankReferenceArt/);
  assert.match(loader, /parts\.join\(''\)/);
  for (let index = 1; index <= 5; index += 1) {
    const part = await read(`assets/approved-bank-reference-4k-${String(index).padStart(2, '0')}.txt`);
    assert.ok(part.length > 6000);
  }
  for (let index = 6; index <= 20; index += 1) {
    assert.equal(await read(`assets/approved-bank-reference-4k-${String(index).padStart(2, '0')}.txt`), '');
  }
});
