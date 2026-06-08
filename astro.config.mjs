// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// Agents Academy — Astro SSR on Cloudflare Workers + React 19 islands.
// Mirrors the cloudflare/fe/marketing-site stack (Astro + @astrojs/cloudflare,
// React islands, Tailwind v4 @theme). Production target upgrades to Astro 6 to
// match marketing-site exactly; the component/design-system code is identical.
export default defineConfig({
  output: "server",
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // React 19 SSR on Workers: the default `react-dom/server` resolves to the
      // browser build, which references MessageChannel at module init and crashes
      // workerd ("MessageChannel is not defined"). The edge build avoids it.
      alias: {
        "react-dom/server": "react-dom/server.edge",
      },
    },
  },
});
