import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  ssr: {
    external: ["kokoro-js", "@huggingface/transformers", "phonemizer", "onnxruntime-web"],
  },
  optimizeDeps: {
    exclude: ["kokoro-js", "@huggingface/transformers"],
  },
});
