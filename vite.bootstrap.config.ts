import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

/** Second-pass build: lightweight client bootstrap without TanStack Start. */
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  build: {
    outDir: '.output/public',
    emptyOutDir: false,
    manifest: 'bootstrap-manifest.json',
    rolldownOptions: {
      input: {
        bootstrap: resolve(__dirname, 'src/bootstrap.tsx'),
      },
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-react', test: /node_modules\/react/ },
            { name: 'vendor-motion', test: /node_modules\/(motion|framer-motion)/ },
          ],
        },
      },
    },
  },
});
