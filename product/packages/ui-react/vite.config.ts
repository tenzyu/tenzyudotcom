/// <reference types='vitest' />

import * as path from "node:path";
import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: "../../../node_modules/.vite/product/packages/ui-react",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(["*.md"]),
    dts({
      entryRoot: "src",
      tsconfigPath: path.join(import.meta.dirname, "tsconfig.lib.json"),
      pathsToAliases: false,
    }),
  ],
  // Configuration for building your library.
  // See: https://vite.dev/guide/build.html#library-mode
  build: {
    outDir: "../../../dist/product/packages/ui-react",
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: "src/index.ts",
      name: "ui-react",
      fileName: "index",
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ["es" as const],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
  },
});
