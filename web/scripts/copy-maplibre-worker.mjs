// maplibre-gl 6 locates its worker script through import.meta.url, which webpack rewrites,
// so in a production build the worker would be requested from the page URL and every map
// fails to load. Serve the worker from /public instead (see maplibreLib in lib/basemap.ts),
// copied fresh on every dev/build so it always matches the installed maplibre-gl version.
import { copyFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const source = path.join(path.dirname(require.resolve("maplibre-gl/package.json")), "dist", "maplibre-gl-worker.mjs");
copyFileSync(source, path.join(import.meta.dirname, "..", "public", "maplibre-gl-worker.mjs"));
