import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Con dominio propio (lubrimec.shop via CNAME) el sitio se sirve desde la raíz.
// Sin dominio (URL github.io con subpath) hay que usar el nombre del repo como base.
// CUSTOM_DOMAIN=1 fuerza la raíz; si no, detectamos el CNAME publicado.
const hasCustomDomain =
  process.env.CUSTOM_DOMAIN === "1" || existsSync("public/CNAME");
const base =
  process.env.GITHUB_PAGES && !hasCustomDomain ? "/lubriauto-your-auto-hub/" : "/";

export default defineConfig({
  base,
  server: { host: "::", port: 8080 },
  // Mismo pipeline CSS en dev y en build.
  css: { transformer: "lightningcss" },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    // GitHub Pages no tiene servidor: build estático SPA.
    tanstackStart({
      // Entrada del servidor en src/server.ts (wrapper de errores SSR, usado al prerenderizar).
      server: { entry: "server" },
      // SPA mode: prerender un shell index.html y deja que el cliente hidrate las rutas.
      spa: { enabled: true },
      prerender: { enabled: true, crawlLinks: false },
    }),
    viteReact(),
  ],
});
