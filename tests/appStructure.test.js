import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

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
  const script = await read('app.js');
  assert.match(script, /localStorage/);
  assert.match(script, /setTimeout/);
  assert.match(script, /buildBankStops/);
});

test('registers an offline service worker', async () => {
  const script = await read('app.js');
  assert.match(script, /serviceWorker/);
  const worker = await read('service-worker.js');
  assert.match(worker, /camilles-finance-v5/);
});

test('renders a recognizable bank floor plan with a dedicated vault wing', async () => {
  const html = await read('index.html');
  const styles = await read('styles.css');
  assert.match(html, /class="bank-building"/);
  assert.match(html, /id="bank-vault"/);
  assert.match(html, /id="vault-boxes"/);
  assert.match(html, /class="bank-corridor"/);
  assert.match(styles, /\.bank-vault/);
  assert.match(styles, /\.safety-deposit-box/);
});

test('provides editable safety-deposit boxes on the savings screen', async () => {
  const html = await read('index.html');
  const script = await read('app.js');
  assert.match(html, /id="vault-box-editor"/);
  assert.match(script, /renderVaultBoxEditor/);
  assert.match(script, /data-vault-box-saved/);
});

test('renders furnished bill offices and facial features on both characters', async () => {
  const html = await read('index.html');
  const script = await read('app.js');
  const styles = await read('styles.css');
  assert.match(html, /class="pixel eye left-eye"/);
  assert.match(html, /class="pixel nose"/);
  assert.match(html, /class="pixel mouth"/);
  assert.match(script, /room-stage/);
  assert.match(script, /roomOfficeTitle/);
  assert.match(styles, /\.room-desk/);
  assert.match(styles, /\.pixel-character \.eye/);
});

test('ships the approved 4k bank reference art and paycheck planner', async () => {
  const html = await read('index.html');
  const script = await read('app.js');
  assert.match(html, /id="bank-reference-art"/);
  assert.match(html, /id="paycheck-editor"/);
  assert.match(html, /id="save-paychecks"/);
  assert.match(html, /data-bank-art-parts="4"/);
  assert.match(script, /renderPaychecks/);
  assert.match(script, /routeBillsToPaychecks/);
  assert.match(script, /loadBankReferenceArt/);
  for (let index = 1; index <= 4; index += 1) {
    const part = await read(`assets/approved-bank-reference-4k-${index}.txt`);
    assert.ok(part.length > 80000);
  }
});
