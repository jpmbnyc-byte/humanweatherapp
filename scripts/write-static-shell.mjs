#!/usr/bin/env node
/**
 * Writes a static index.html to .output/public so Cloudflare can serve
 * the boot splash instantly from CDN — before the worker cold-starts.
 *
 * Loads the lightweight bootstrap bundle (no TanStack Start) for ~100KB gzip savings.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const PUBLIC = join(ROOT, '.output/public');
const SERVER = join(ROOT, '.output/server');
const ASSETS = join(PUBLIC, 'assets');

function assetUrl(relativePath) {
  if (!relativePath) return null;
  return relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
}

async function findManifestFile() {
  const files = await readdir(SERVER);
  const name = files.find(f => f.startsWith('_tanstack-start-manifest_v-') && f.endsWith('.mjs'));
  if (!name) throw new Error('TanStack start manifest not found in .output/server');
  return join(SERVER, name);
}

async function findStylesheet() {
  const files = await readdir(ASSETS);
  const css = files.find(f => f.startsWith('styles-') && f.endsWith('.css'));
  return css ? `/assets/${css}` : null;
}

function extractIndexScript(manifestSource) {
  const match = manifestSource.match(/src:\s*"(\/assets\/index-[^"]+\.js)"/);
  if (!match) throw new Error('Could not find index bundle in start manifest');
  return match[1];
}

/** Preload only the default-tab critical path — not lazy tab chunks. */
function criticalPreloads(manifest) {
  const preloads = new Set();

  const addKey = (key) => {
    const entry = manifest[key];
    if (entry?.file) preloads.add(assetUrl(entry.file));
    return entry;
  };

  const addStaticImports = (entry) => {
    for (const imp of entry?.imports ?? []) addKey(imp);
  };

  const bootstrap = addKey('src/bootstrap.tsx');
  addStaticImports(bootstrap);

  for (const dyn of bootstrap?.dynamicImports ?? []) {
    const app = addKey(dyn);
    addStaticImports(app);
    for (const dyn2 of app?.dynamicImports ?? []) {
      if (dyn2 !== 'src/components/SomaticTabView.tsx') continue;
      const somatic = addKey(dyn2);
      addStaticImports(somatic);
    }
  }

  return [...preloads];
}

async function resolveBootstrapEntry() {
  const manifestPath = join(PUBLIC, 'bootstrap-manifest.json');
  try {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const entry = manifest['src/bootstrap.tsx'];
    if (!entry?.file) return null;

    const script = assetUrl(entry.file);
    const preloads = criticalPreloads(manifest).filter(href => href && href !== script);

    return { script, preloads: [...new Set(preloads)] };
  } catch {
    return null;
  }
}

function shellHtml({ entryScript, cssHref, preloads }) {
  const cssLink = cssHref
    ? `<link rel="preload" href="${cssHref}" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${cssHref}"></noscript>`
    : '';

  const preloadLinks = preloads
    .filter(href => href !== entryScript)
    .map(href => `<link rel="modulepreload" href="${href}">`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#faf8f5">
<title>Human Weather</title>
<link rel="dns-prefetch" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://fonts.gstatic.com">
<style>
#hw-boot{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:#faf8f5;color:#2c2824;font-family:Georgia,"Times New Roman",serif}
#hw-boot-inner{text-align:center;padding:1.5rem;max-width:20rem}
#hw-boot-eyebrow{font-size:11px;letter-spacing:0.25em;text-transform:uppercase;opacity:0.4;margin:0 0 1rem}
#hw-boot-title{font-size:clamp(1.75rem,6vw,2.5rem);font-weight:500;margin:0;line-height:1.15}
#hw-boot-title em{font-style:italic;color:#8a6f2e}
#hw-boot-sub{font-size:0.95rem;font-style:italic;opacity:0.65;margin:1rem 0 0}
#hw-boot-bar{height:3px;width:min(12rem,60vw);margin:1.25rem auto 0;border-radius:999px;background:rgba(44,40,36,0.12);overflow:hidden}
#hw-boot-bar>i{display:block;height:100%;width:35%;background:#c4a044;border-radius:999px;animation:hw-boot-slide 1.4s ease-in-out infinite}
@keyframes hw-boot-slide{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}
@media (prefers-color-scheme:dark){
  #hw-boot{background:#141210;color:#f5f0e8}
  #hw-boot-title em{color:#d4b85a}
  #hw-boot-bar{background:rgba(255,255,255,0.08)}
  #hw-boot-bar>i{background:#d4b85a}
}
</style>
${cssLink}
<link rel="modulepreload" href="${entryScript}">
${preloadLinks}
<script>
(function(){
  var sub=document.getElementById('hw-boot-sub');
  function set(t){if(sub)sub.textContent=t;}
  set('Opening your field station…');
  window.__hwBootStatus=set;
  var steps=[
    [1200,'Loading app…'],
    [3500,'Preparing field station…'],
    [8000,'Still loading — slow connection…'],
    [15000,'Almost there…']
  ];
  steps.forEach(function(s){setTimeout(function(){set(s[1]);},s[0]);});
  window.addEventListener('error',function(){set('Having trouble loading. Try refresh.');});
})();
</script>
</head>
<body>
<div id="hw-boot" aria-live="polite" aria-busy="true">
  <div id="hw-boot-inner">
    <p id="hw-boot-eyebrow">human weather</p>
    <h1 id="hw-boot-title">Human <em>Weather</em></h1>
    <p id="hw-boot-sub">Opening your field station…</p>
    <div id="hw-boot-bar" aria-hidden="true"><i></i></div>
  </div>
</div>
<div id="app-mount"></div>
<script type="module" src="${entryScript}"></script>
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
    text = `${text.trimEnd()}\n\n${block}`;
  }

  const assetCache = `/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;
  if (!text.includes('/assets/*')) {
    text = `${text.trimEnd()}\n\n${assetCache}`;
  }

  await writeFile(headersPath, `${text.trimEnd()}\n`, 'utf8');
}

async function main() {
  const bootstrap = await resolveBootstrapEntry();
  let entryScript = bootstrap?.script;
  let preloads = bootstrap?.preloads ?? [];

  if (!entryScript) {
    const manifestPath = await findManifestFile();
    const manifestSource = await readFile(manifestPath, 'utf8');
    entryScript = extractIndexScript(manifestSource);
    console.warn('[write-static-shell] bootstrap bundle missing — falling back to TanStack index');
  }

  const cssHref = await findStylesheet();
  const html = shellHtml({ entryScript, cssHref, preloads });
  await writeFile(join(PUBLIC, 'index.html'), html, 'utf8');
  await patchWrangler();
  await patchHeaders();
  console.log(`[write-static-shell] Wrote index.html → ${entryScript} (+${preloads.length} preloads)`);
}

main().catch(err => {
  console.error('[write-static-shell]', err);
  process.exit(1);
});
