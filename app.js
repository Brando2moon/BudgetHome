const themeFiles = [
  ['./reference-theme.css?v=4', 'reference-theme'],
  ['./paycheck-4k-theme.css?v=8', 'paycheck-4k-theme'],
];

for (const [href, key] of themeFiles) {
  if (document.querySelector(`link[data-theme-key="${key}"]`)) continue;
  const theme = document.createElement('link');
  theme.rel = 'stylesheet';
  theme.href = href;
  theme.dataset.themeKey = key;
  document.head.append(theme);
}

document.querySelector('#bank-reference-art')?.setAttribute('data-bank-art-parts', '8');

const partPaths = ['./app-source-1.txt', './app-source-2.txt', './app-source-3.txt'];

try {
  const responses = await Promise.all(partPaths.map((path) => fetch(path, { cache: 'no-store' })));
  const failed = responses.find((response) => !response.ok);
  if (failed) throw new Error(`Could not load application source (${failed.status}).`);

  const parts = await Promise.all(responses.map((response) => response.text()));
  const engineUrl = new URL('./src/budgetEngine.js', window.location.href).href;
  const source = parts.join('')
    .replace("'./src/budgetEngine.js'", JSON.stringify(engineUrl))
    .replaceAll('./assets/approved-bank-reference-4k-', './assets/exact-approved-v8-')
    .replace('data:image/webp;base64,', 'data:image/avif;base64,');
  const moduleUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  await import(moduleUrl);
  URL.revokeObjectURL(moduleUrl);
} catch (error) {
  console.error(error);
  document.body.innerHTML = `<main style="max-width:720px;margin:4rem auto;padding:2rem;font-family:system-ui"><h1>Camille's Finance Bank</h1><p>The app could not start. Run it through a local web server instead of opening the HTML file directly.</p><pre>${String(error)}</pre></main>`;
}
