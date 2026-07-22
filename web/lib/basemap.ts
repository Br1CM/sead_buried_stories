import type { StyleSpecification } from "maplibre-gl";

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
