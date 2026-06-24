// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Con dominio propio (lubrimec.shop via CNAME) el sitio se sirve desde la raíz.
const base = "/";

export default defineConfig({
  // GitHub Pages no tiene servidor: build estatico SPA (sin nitro/Cloudflare).
  nitro: false,
  vite: {
    base,
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // SPA mode: prerender un shell index.html y deja que el cliente hidrate las rutas.
    spa: { enabled: true },
    prerender: { enabled: true, crawlLinks: false },
  },
});
