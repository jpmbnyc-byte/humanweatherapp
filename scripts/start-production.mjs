#!/usr/bin/env node
/**
 * Production start for Render/Node — verify artifact, then listen on PORT.
 */
import { access, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const serverEntry = join(ROOT, '.output/server/index.mjs');
const nitroJsonPath = join(ROOT, '.output/nitro.json');

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

if (!(await pathExists(serverEntry))) {
  console.error('[start] Missing .output/server/index.mjs — build did not complete.');
  process.exit(1);
}

if (await pathExists(nitroJsonPath)) {
  const nitro = JSON.parse(await readFile(nitroJsonPath, 'utf8'));
  const preset = nitro.preset ?? 'unknown';
  if (preset !== 'node-server') {
    console.error(`[start] Wrong Nitro preset "${preset}" for Node hosting.`);
    console.error('[start] Redeploy with NITRO_PRESET=node-server (latest main).');
    process.exit(1);
  }
  console.info(`[start] Nitro preset=${preset} port=${process.env.PORT ?? '3000'}`);
}

const child = spawn(process.execPath, [serverEntry], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
