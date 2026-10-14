import type { StyleSpecification } from "maplibre-gl";

// maplibre-gl 6 can't find its worker script in a webpack build (it resolves it from
// import.meta.url), so point it at the copy served from /public -- see
// scripts/copy-maplibre-worker.mjs. Pass as `mapLib` to every react-map-gl <Map>.
export const maplibreLib =
  typeof window === "undefined"
    ? undefined
    : import("maplibre-gl").then((maplibre) => {
        maplibre.setWorkerUrl(`/maplibre-gl-worker.mjs?v=${maplibre.getVersion()}`);
        return maplibre;
      });

// Free, no-API-key raster basemap. Fine for light traffic; swap for a vector style
// from MapTiler/Stadia (free tier) before this app sees real public load, per OSM's
// tile usage policy.
export const osmRasterStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};
