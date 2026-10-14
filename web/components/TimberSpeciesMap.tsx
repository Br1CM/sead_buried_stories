"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import Map, { Marker, MapRef } from "react-map-gl/maplibre";
import type { LngLatBoundsLike } from "maplibre-gl";
import { maplibreLib, osmRasterStyle } from "@/lib/basemap";
import { speciesColor } from "@/lib/speciesColors";
import type { TimberSpeciesPoint } from "@/lib/types";

const SWEDEN_BOUNDS: LngLatBoundsLike = [
  [10.5, 54.9],
  [24.5, 69.5],
];

const SEAD_SITE_URL = "https://browser.sead.se/site/";

export function TimberSpeciesMap({ points }: { points: TimberSpeciesPoint[] }) {
  const mapRef = useRef<MapRef | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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
      mapLib={maplibreLib}
      mapStyle={osmRasterStyle}
      initialViewState={{ bounds: SWEDEN_BOUNDS, fitBoundsOptions: { padding: 40 } }}
      style={{ width: "100%", height: "100%" }}
    >
      {points.map((p, i) => {
        const isHovered = i === hoveredIndex;
        return (
          <Marker
            key={`${p.site_id}-${i}`}
            longitude={p.lon}
            latitude={p.lat}
            anchor="center"
            style={{ zIndex: isHovered ? 2 : 1 }}
          >
            <a
              href={`${SEAD_SITE_URL}${p.site_id}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${p.site_name} — open in the SEAD browser`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex((h) => (h === i ? null : h))}
              onFocus={() => setHoveredIndex(i)}
              onBlur={() => setHoveredIndex((h) => (h === i ? null : h))}
              className={`relative block cursor-pointer rounded-full border transition-all ${
                isHovered ? "h-4 w-4 border-2 border-white" : "h-2.5 w-2.5 border-white/40"
              }`}
              style={{ background: speciesColor(p.species) }}
            >
              {isHovered && (
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-cream-10 bg-overlay px-3 py-1.5 text-sm shadow-lg">
                  <span className="block font-medium text-cream-70">{p.site_name}</span>
                  <span className="block text-xs text-cream-30">
                    {p.species}, {p.year}
                  </span>
                  <span className="block text-xs text-accent">Open in SEAD browser &#8599;</span>
                </span>
              )}
            </a>
          </Marker>
        );
      })}
    </Map>
  );
}
