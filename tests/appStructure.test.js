import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const readAppSource = async () => {
  try {
    return (await Promise.all([
      read('app-source-1.txt'), read('app-source-2.txt'), read('app-source-3.txt'),
    ])).join('\n');
  } catch {
    return read('app.js');
  }
};

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

test('registers the refreshed offline service worker', async () => {
  const source = await readAppSource();
  assert.match(source, /serviceWorker/);
  const worker = await read('service-worker.js');
  assert.match(worker, /camilles-finance-v4/);
  assert.match(worker, /reference-theme\.css/);
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
  const source = await readAppSource();
  assert.match(html, /id="vault-box-editor"/);
  assert.match(source, /renderVaultBoxEditor/);
  assert.match(source, /data-vault-box-saved/);
});

test('loads the cutaway theme with furnished rooms and character facial features', async () => {
  const loader = await read('app.js');
  const theme = await read('reference-theme.css');
  assert.match(loader, /reference-theme\.css/);
  assert.match(theme, /\.bank-room::before/);
  assert.match(theme, /\.bank-room::after/);
  assert.match(theme, /\.pixel-character \.head::before/);
  assert.match(theme, /\.pixel-character \.head::after/);
});
