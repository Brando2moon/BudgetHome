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

test('registers the release 8 service worker', async () => {
  const source = await readAppSource();
  assert.match(source, /serviceWorker/);
  assert.match(await read('service-worker.js'), /camilles-finance-v8/);
});

test('keeps the bank, savings vault, paycheck planner, and editable characters', async () => {
  const html = await read('index.html');
  const source = await readAppSource();
  assert.match(html, /class="bank-building"/);
  assert.match(html, /id="bank-vault"/);
  assert.match(html, /id="vault-box-editor"/);
  assert.match(html, /id="paycheck-editor"/);
  assert.match(html, /id="save-paychecks"/);
  assert.match(html, /class="pixel eye left-eye"/);
  assert.match(html, /class="pixel nose"/);
  assert.match(html, /class="pixel mouth"/);
  assert.match(source, /renderVaultBoxEditor/);
  assert.match(source, /renderPaychecks/);
  assert.match(source, /routeBillsToPaychecks/);
});

test('ships the exact approved AI Workshop visual as eight verified AVIF parts', async () => {
  const loader = await read('app.js');
  const styles = await read('paycheck-4k-theme.css');
  const parts = await Promise.all(Array.from({ length: 8 }, (_, index) => (
    read(`assets/exact-approved-v8-${String(index + 1).padStart(2, '0')}.txt`)
  )));
  const artwork = Buffer.from(parts.join(''), 'base64');
  const digest = createHash('sha256').update(artwork).digest('hex');

  assert.equal(digest, '781b4e3811c379836807946474f042ea950a8467af0e65bd4a1af175b7e5dafb');
  assert.match(loader, /data-bank-art-parts', '8'/);
  assert.match(loader, /exact-approved-v8-/);
  assert.match(loader, /data:image\/avif;base64/);
  assert.match(styles, /aspect-ratio:\s*1586\s*\/\s*992/);
  assert.match(styles, /\.bank-room > \*/);
  assert.match(styles, /background:\s*transparent\s*!important/);
  assert.match(styles, /\.pixel-character, \.thought-bubble/);
});

test('publishes every exact visual part in the Pages workflow', async () => {
  const workflow = await read('.github/workflows/deploy-pages.yml');
  const worker = await read('service-worker.js');
  assert.match(workflow, /cp assets\/exact-approved-v8-\*\.txt _site\/assets\//);
  assert.match(worker, /length: 8/);
  assert.match(worker, /exact-approved-v8-/);
});
