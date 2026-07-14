#!/usr/bin/env node
/**
 * Fail the build on Render if Nitro did not produce a Node server artifact.
 * Prevents deploying a Cloudflare worker build with `npm start` (silent no-op).
 */
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const shouldVerify =
  process.env.RENDER === 'true' ||
  process.env.NITRO_PRESET?.trim() === 'node-server' ||
  process.env.VERIFY_NODE_BUILD === '1';

if (!shouldVerify) {
  process.exit(0);
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

const nitroJsonPath = join(ROOT, '.output/nitro.json');
const serverEntryPath = join(ROOT, '.output/server/index.mjs');

if (!(await pathExists(nitroJsonPath)) || !(await pathExists(serverEntryPath))) {
  console.error('[verify-node-build] Missing .output/server/index.mjs after build.');
  process.exit(1);
}

const nitro = JSON.parse(await readFile(nitroJsonPath, 'utf8'));
const preset = nitro.preset ?? 'unknown';

if (preset !== 'node-server') {
  console.error(
    `[verify-node-build] Wrong Nitro preset "${preset}". Render requires "node-server".`,
  );
  console.error('[verify-node-build] Set NITRO_PRESET=node-server in Render env and redeploy main.');
  process.exit(1);
}

console.log(`[verify-node-build] OK — preset=${preset}, server=${nitro.serverEntry}`);
