// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Cross-origin isolation enables SharedArrayBuffer, which lets the in-browser Kokoro
// voice engine (onnxruntime-web) run multi-threaded, off-main-thread WASM inference —
// faster and non-blocking (so playback stays smooth instead of freezing the UI).
// COEP `credentialless` still lets the cross-origin kokoro-js (jsDelivr) and model
// (Hugging Face) loads succeed without requiring CORP headers on those responses.
// NOTE: this is applied via middleware because the Lovable config wrapper strips
// `server.headers` in sandbox mode.
const crossOriginIsolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
};
const crossOriginIsolation = () => {
  const apply = (server: { middlewares: { use: (fn: (req: unknown, res: { setHeader: (k: string, v: string) => void }, next: () => void) => void) => void } }) => {
    server.middlewares.use((_req, res, next) => {
      for (const [k, v] of Object.entries(crossOriginIsolationHeaders)) res.setHeader(k, v);
      next();
    });
  };
  return {
    name: "hw-cross-origin-isolation",
    configureServer: apply,
    configurePreviewServer: apply,
  };
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [crossOriginIsolation()],
  },
});
