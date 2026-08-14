"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import Map, { Marker, MapRef } from "react-map-gl/maplibre";
import type { LngLatBoundsLike } from "maplibre-gl";
import { osmRasterStyle } from "@/lib/basemap";
import { speciesColor } from "@/lib/speciesColors";
import type { TimberSpeciesPoint } from "@/lib/types";

const SWEDEN_BOUNDS: LngLatBoundsLike = [
  [10.5, 54.9],
  [24.5, 69.5],
];

export function TimberSpeciesMap({ points }: { points: TimberSpeciesPoint[] }) {
  const mapRef = useRef<MapRef | null>(null);
  const hasFitOnce = useRef(false);

  // Fit to all of Sweden once on mount, not on every bucket change -- otherwise the
  // view jumps around as different eras have samples in different regions, which
  // fights the "watch one place over time" reading of the map.
  useEffect(() => {
    if (hasFitOnce.current) return;
    const map = mapRef.current;
    if (!map) return;
    hasFitOnce.current = true;
    map.fitBounds(SWEDEN_BOUNDS, { padding: 40, duration: 0 });
  }, []);

  return (
    <Map
      ref={mapRef}
      mapStyle={osmRasterStyle}
      initialViewState={{ bounds: SWEDEN_BOUNDS, fitBoundsOptions: { padding: 40 } }}
      style={{ width: "100%", height: "100%" }}
    >
      {points.map((p, i) => (
        <Marker key={`${p.site_id}-${i}`} longitude={p.lon} latitude={p.lat} anchor="center">
          <div
            className="h-2.5 w-2.5 rounded-full border border-white/40"
            style={{ background: speciesColor(p.species) }}
            title={`${p.site_name} — ${p.species}, ${p.year}`}
          />
        </Marker>
      ))}
    </Map>
  );
}
