import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * Select the host-native Nitro output unless a deployment explicitly
 * overrides it. Render remains the self-hosted node-server target.
 */
function resolveNitroPreset(): string {
  const explicit = process.env.NITRO_PRESET?.trim();
  if (explicit) return explicit;
  if (process.env.VERCEL === "1") return "vercel";
  if (process.env.NETLIFY === "true") return "netlify";
  return "node-server";
}

const nitroPreset = resolveNitroPreset();

export default defineConfig({
  nitro: {
    preset: nitroPreset,
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
