#!/usr/bin/env node
/**
 * Writes a static index.html to .output/public so Cloudflare can serve
 * the boot splash instantly from CDN — before the worker cold-starts.
 */
import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

const OUTPUT_CANDIDATES = [
  { public: '.output/public', server: '.output/server' },
  { public: 'dist/client', server: 'dist/server' },
];

let PUBLIC;
let SERVER;

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function resolveOutputPaths() {
  for (const candidate of OUTPUT_CANDIDATES) {
    const server = join(ROOT, candidate.server);
    const publicDir = join(ROOT, candidate.public);
    if (await pathExists(server)) {
      PUBLIC = publicDir;
      SERVER = server;
      return;
    }
  }
  throw new Error(
    'Build output not found. Expected .output/server or dist/server after vite build.',
  );
}

async function findManifestFile() {
  const files = await readdir(SERVER);
  const name = files.find(f => f.startsWith('_tanstack-start-manifest_v-') && f.endsWith('.mjs'));
  if (!name) throw new Error('TanStack start manifest not found in .output/server');
  return join(SERVER, name);
}

async function findStylesheet() {
  const assets = join(PUBLIC, 'assets');
  const files = await readdir(assets);
  const css = files.find(f => f.startsWith('styles-') && f.endsWith('.css'));
  return css ? `/assets/${css}` : null;
}

function extractIndexScript(manifestSource) {
  const match = manifestSource.match(/src:\s*"(\/assets\/index-[^"]+\.js)"/);
  if (!match) throw new Error('Could not find index bundle in start manifest');
  return match[1];
}

function shellHtml({ indexScript, cssHref }) {
  const cssLink = cssHref
    ? `<link rel="preload" href="${cssHref}" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${cssHref}"></noscript>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#141210">
<link rel="icon" type="image/png" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<title>Human Weather</title>
<style>
#hw-boot{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:#faf8f5;color:#2c2824;font-family:Georgia,"Times New Roman",serif}
#hw-boot-inner{text-align:center;padding:1.5rem;max-width:20rem}
#hw-boot-logo{width:5.5rem;height:5.5rem;border-radius:1.25rem;margin:0 auto 1rem;display:block;box-shadow:0 4px 24px rgba(0,0,0,0.12)}
#hw-boot-sub{font-size:0.95rem;font-style:italic;opacity:0.65;margin:1rem 0 0}
#hw-boot-bar{height:3px;width:min(12rem,60vw);margin:1.25rem auto 0;border-radius:999px;background:rgba(44,40,36,0.12);overflow:hidden}
#hw-boot-bar>i{display:block;height:100%;width:35%;background:#c4a044;border-radius:999px;animation:hw-boot-slide 1.4s ease-in-out infinite}
@keyframes hw-boot-slide{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}
@media (prefers-color-scheme:dark){
  #hw-boot{background:#141210;color:#f5f0e8}
  #hw-boot-bar{background:rgba(255,255,255,0.08)}
  #hw-boot-bar>i{background:#d4b85a}
}
</style>
${cssLink}
<link rel="modulepreload" href="${indexScript}">
<script>
(function(){
  var sub=document.getElementById('hw-boot-sub');
  function set(t){if(sub)sub.textContent=t;}
  set('Opening your field station…');
  window.__hwBootStatus=set;
  var t0=Date.now();
  var steps=[
    [600,'Loading app…'],
    [2000,'Preparing field station…'],
    [5000,'Still loading — slow connection…'],
    [10000,'Almost there…']
  ];
  steps.forEach(function(s){setTimeout(function(){set(s[1]);},s[0]);});
  window.addEventListener('error',function(){set('Having trouble loading. Try refresh.');});
})();
</script>
</head>
<body>
<div id="hw-boot" aria-live="polite" aria-busy="true">
  <div id="hw-boot-inner">
    <img id="hw-boot-logo" src="/apple-touch-icon.png" alt="" width="88" height="88" decoding="async">
    <p id="hw-boot-sub">Opening your field station…</p>
    <div id="hw-boot-bar" aria-hidden="true"><i></i></div>
  </div>
</div>
<script type="module" src="${indexScript}"></script>
</body>
</html>
`;
}

async function patchWrangler() {
  const wranglerPath = join(SERVER, 'wrangler.json');
  const raw = await readFile(wranglerPath, 'utf8');
  const config = JSON.parse(raw);
  config.assets = {
    ...config.assets,
    html_handling: 'auto-trailing-slash',
    not_found_handling: 'single-page-application',
  };
  await writeFile(wranglerPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

async function patchHeaders() {
  const headersPath = join(PUBLIC, '_headers');
  let text = '';
  try {
    text = await readFile(headersPath, 'utf8');
  } catch {
    /* new file */
  }
  const block = `/index.html
  Cache-Control: public, max-age=0, must-revalidate

/
  Cache-Control: public, max-age=0, must-revalidate
`;
  if (!text.includes('/index.html')) {
    await writeFile(headersPath, `${text.trimEnd()}\n\n${block}`, 'utf8');
  }
}

async function main() {
  await resolveOutputPaths();
  const manifestPath = await findManifestFile();
  const manifestSource = await readFile(manifestPath, 'utf8');
  const indexScript = extractIndexScript(manifestSource);
  const cssHref = await findStylesheet();
  const html = shellHtml({ indexScript, cssHref });
  await writeFile(join(PUBLIC, 'index.html'), html, 'utf8');
  if (await pathExists(join(SERVER, 'wrangler.json'))) {
    await patchWrangler();
  }
  await patchHeaders();
  console.log(`[write-static-shell] Wrote index.html → ${indexScript}`);
}

main().catch(err => {
  console.error('[write-static-shell]', err);
  process.exit(1);
});
