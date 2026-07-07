import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Native Vite config (decoupled from @lovable.dev/vite-tanstack-config).
// Reproduces the non-Lovable pieces the wrapper used to assemble:
//   Tailwind v4, tsconfig path aliases, TanStack Start (+ router/nitro), React,
//   the `@` alias, React dedupe, LightningCSS, and the :8080 dev/preview server.
// Dropped Lovable-only tooling: componentTagger, hmr-gate, dev-server-bridge,
// asset proxy, and the sandbox dev error loggers.

// Cross-origin isolation so the in-browser Kokoro voice engine (onnxruntime-web)
// can use SharedArrayBuffer → multi-threaded, off-main-thread WASM inference.
// COEP `credentialless` still lets cross-origin CDN/model fetches load without CORP.
// Applied via middleware so the headers also land on the SSR-rendered document
// (Vite's `server.headers` doesn't cover TanStack Start's SSR responses).
const crossOriginIsolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
};
const crossOriginIsolation = () => {
  const apply = (server: {
    middlewares: {
      use: (
        fn: (
          req: unknown,
          res: { setHeader: (k: string, v: string) => void },
          next: () => void,
        ) => void,
      ) => void;
    };
  }) => {
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

export default defineConfig(async ({ command, mode }) => {
  const isDevBuild = command === "build" && mode === "development";

  const plugins = [
    crossOriginIsolation(),
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Redirect the bundled server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
      // Keep server-only modules out of the client bundle.
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
  ];

  // Nitro participates only in production builds (Cloudflare module by default;
  // override with the NITRO_PRESET env var or by editing `defaultPreset`).
  if (command === "build") {
    const { nitro } = await import("nitro/vite");
    plugins.push(nitro({ defaultPreset: "cloudflare-module" }));
  }

  plugins.push(viteReact());

  return {
    plugins,
    // Run LightningCSS in dev too (Vite only runs it at build by default), so the
    // dev preview matches the built output — notably for prefixed backdrop-filter,
    // which this app uses heavily.
    css: { transformer: "lightningcss" as const },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    // Pre-bundle the always-present client deps and tolerate stale optimized-dep
    // requests so re-optimization doesn't 504 open tabs. React core only —
    // pulling @tanstack/react-start here would drag its node server entry client-side.
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      ignoreOutdatedRequests: true,
    },
    server: {
      host: "::",
      port: 8080,
    },
    preview: {
      host: "::",
      port: 8080,
    },
    // Client-scoped dev define so React DevTools gets the dev react-dom without a
    // global NODE_ENV flip (which would emit jsxDEV the SSR runtime can't resolve).
    ...(isDevBuild
      ? {
          environments: {
            client: { define: { "process.env.NODE_ENV": JSON.stringify("development") } },
          },
          esbuild: { keepNames: true },
        }
      : {}),
  };
});
