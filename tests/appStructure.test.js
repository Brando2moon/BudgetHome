import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
  assert.match(await read('service-worker.js'), /camilles-finance-v7/);
});

test('keeps the bank data tools, savings editor, and customizable character', async () => {
  const html = await read('index.html');
  const source = await readAppSource();
  assert.match(html, /class="bank-building"/);
  assert.match(html, /id="bank-vault"/);
  assert.match(html, /id="vault-box-editor"/);
  assert.match(html, /class="pixel eye left-eye"/);
  assert.match(html, /class="pixel nose"/);
  assert.match(html, /class="pixel mouth"/);
  assert.match(source, /renderVaultBoxEditor/);
  assert.match(source, /room-stage/);
});

test('ships the approved office visual with invisible interaction zones', async () => {
  const html = await read('index.html');
  const source = await readAppSource();
  const loader = await read('app.js');
  const exactStyles = await read('paycheck-4k-theme.css');

  assert.match(html, /id="bank-reference-art"/);
  assert.match(html, /exact approved office background/);
  assert.match(source, /loadBankReferenceArt/);
  assert.match(loader, /data-bank-art-parts['"],\s*['"]35/);
  assert.match(loader, /parts\.join\(''\)/);
  assert.match(exactStyles, /aspect-ratio:\s*1586\s*\/\s*992/);
  assert.match(exactStyles, /\.bank-room,[\s\S]*background:\s*transparent\s*!important/);
  assert.match(exactStyles, /\.room-banner,[\s\S]*display:\s*none\s*!important/);

  const encoded = (await Promise.all(Array.from({ length: 35 }, (_, index) =>
    read(`assets/approved-bank-reference-4k-${String(index + 1).padStart(2, '0')}.txt`)
  ))).join('');
  const art = Buffer.from(encoded, 'base64');
  assert.equal(createHash('sha256').update(art).digest('hex'), 'b5c7db638862a5c6b9b5ef9a027b5e7f69f15cb0c6b19b1d2e3a8a98bc846e6c');
});

test('keeps the paycheck planner and closest-paycheck routing', async () => {
  const html = await read('index.html');
  const source = await readAppSource();
  assert.match(html, /id="paycheck-editor"/);
  assert.match(html, /id="save-paychecks"/);
  assert.match(source, /renderPaychecks/);
  assert.match(source, /routeBillsToPaychecks/);
});
