import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "vendor-react", test: /node_modules\/react/ },
            { name: "vendor-motion", test: /node_modules\/(motion|framer-motion)/ },
            { name: "vendor-tanstack", test: /node_modules\/@tanstack/ },
          ],
        },
      },
    },
  },
});
