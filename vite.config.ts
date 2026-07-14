import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/** Self-hosted (Render): node-server. Lovable CI still forces cloudflare-module. */
const nitroPreset = process.env.NITRO_PRESET?.trim() || "node-server";

export default defineConfig({
  nitro: {
    preset: nitroPreset,
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
