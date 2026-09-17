import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const plugins = [react(), tailwindcss()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Memory-efficiency settings so the production build fits under Hostinger's
    // CloudLinux LVE per-account memory limit (otherwise vite build gets
    // SIGKILL'd mid-way with no error and the deploy "fails" silently).
    minify: "esbuild", // esbuild minifier uses far less memory than terser
    sourcemap: false,
    reportCompressedSize: false, // skip gzip-size computation (CPU/memory heavy)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // Drastically lower peak memory: Rollup processes far fewer files in
      // parallel (default is 20). Small speed cost, big memory saving.
      maxParallelFileOps: 2,
      output: {
        // Split large vendor libraries into their own chunks so no single
        // chunk balloons peak memory during render/minify.
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "radix-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-popover",
          ],
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
