import { writeFileSync } from "node:fs";

// Astro's Cloudflare adapter writes the SSR worker to dist/_worker.js and
// routing metadata to dist/_routes.json. The assets binding points at dist/,
// so we must tell the assets uploader to ignore those — otherwise wrangler
// refuses to upload (it would expose server code as a public asset).
writeFileSync("dist/.assetsignore", "_worker.js\n_routes.json\n");
console.log("postbuild: wrote dist/.assetsignore");
