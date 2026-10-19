"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import Map, { Marker, MapRef } from "react-map-gl/maplibre";
import type { LngLatBoundsLike } from "maplibre-gl";
import { maplibreLib, osmRasterStyle } from "@/lib/basemap";
import type { CeramicsSite } from "@/lib/types";

const SEAD_SITE_URL = "https://browser.sead.se/site/";

export function CeramicsMap({ sites }: { sites: CeramicsSite[] }) {
  const mapRef = useRef<MapRef | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const maxSamples = Math.max(...sites.map((s) => s.n_samples), 1);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || sites.length === 0) return;

    if (sites.length === 1) {
      map.flyTo({ center: [sites[0].lon, sites[0].lat], zoom: 6, duration: 600 });
      return;
    }

    const lons = sites.map((s) => s.lon);
    const lats = sites.map((s) => s.lat);
    const bounds: LngLatBoundsLike = [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ];
    map.fitBounds(bounds, { padding: 60, duration: 600, maxZoom: 10 });
  }, [sites]);

  return (
    <Map
      ref={mapRef}
      mapLib={maplibreLib}
      mapStyle={osmRasterStyle}
      initialViewState={{ longitude: 15, latitude: 58, zoom: 4 }}
      style={{ width: "100%", height: "100%" }}
    >
      {sites.map((s) => {
        const size = 8 + 16 * (s.n_samples / maxSamples);
        const isHovered = s.site_id === hoveredId;
        return (
          <Marker
            key={s.site_id}
            longitude={s.lon}
            latitude={s.lat}
            anchor="center"
            style={{ zIndex: isHovered ? 2 : 1 }}
          >
            <a
              href={`${SEAD_SITE_URL}${s.site_id}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${s.site_name} — open in the SEAD browser`}
              onMouseEnter={() => setHoveredId(s.site_id)}
              onMouseLeave={() => setHoveredId((h) => (h === s.site_id ? null : h))}
              onFocus={() => setHoveredId(s.site_id)}
              onBlur={() => setHoveredId((h) => (h === s.site_id ? null : h))}
              className={`relative block cursor-pointer rounded-full border-2 transition-all ${
                isHovered ? "border-white bg-accent" : "border-white/60 bg-accent/80"
              }`}
              style={{ width: isHovered ? size + 6 : size, height: isHovered ? size + 6 : size }}
            >
              {isHovered && (
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-cream-10 bg-overlay px-3 py-1.5 text-sm shadow-lg">
                  <span className="block font-medium text-cream-70">{s.site_name}</span>
                  <span className="block text-xs text-cream-30">
                    {s.n_samples} sample{s.n_samples === 1 ? "" : "s"}
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
