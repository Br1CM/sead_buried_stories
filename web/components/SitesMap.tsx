"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Map, { Marker, MapRef } from "react-map-gl/maplibre";
import type { LngLatBoundsLike } from "maplibre-gl";
import { osmRasterStyle } from "@/lib/basemap";
import type { SiteIndexEntry } from "@/lib/types";

export function SitesMap({ sites }: { sites: SiteIndexEntry[] }) {
  const mapRef = useRef<MapRef | null>(null);
  const router = useRouter();
  const [hovered, setHovered] = useState<SiteIndexEntry | null>(null);
  const maxTaxa = Math.max(...sites.map((s) => s.n_taxa), 1);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || sites.length === 0) return;

    const lons = sites.map((s) => s.lon);
    const lats = sites.map((s) => s.lat);
    const bounds: LngLatBoundsLike = [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ];
    map.fitBounds(bounds, { padding: 60, duration: 600, maxZoom: 9 });
  }, [sites]);

  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-2xl border border-white/10">
      <Map
        ref={mapRef}
        mapStyle={osmRasterStyle}
        initialViewState={{ longitude: 0, latitude: 52, zoom: 4 }}
        style={{ width: "100%", height: "100%" }}
      >
        {sites.map((s) => {
          const size = 10 + 14 * (s.n_taxa / maxTaxa);
          const isHovered = hovered?.site_id === s.site_id;
          return (
            <Marker
              key={s.site_id}
              longitude={s.lon}
              latitude={s.lat}
              anchor="center"
              onClick={() => router.push(`/sites/${s.site_id}`)}
            >
              <div
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered((h) => (h?.site_id === s.site_id ? null : h))}
                className="cursor-pointer rounded-full border-2 transition-all"
                style={{
                  width: isHovered ? size + 6 : size,
                  height: isHovered ? size + 6 : size,
                  background: isHovered ? "#e0a458" : "rgba(224,164,88,0.75)",
                  borderColor: isHovered ? "#fff" : "rgba(255,255,255,0.5)",
                }}
                aria-label={`Explore ${s.site_name}`}
              />
            </Marker>
          );
        })}
      </Map>

      {hovered && (
        <div className="pointer-events-none absolute top-4 left-4 max-w-xs rounded-lg border border-white/10 bg-[#14100c] px-3 py-2 text-sm shadow-lg">
          <div className="font-medium">{hovered.site_name}</div>
          <div className="text-white/60">
            {hovered.n_layers} dated period{hovered.n_layers === 1 ? "" : "s"} · {hovered.n_taxa} species
          </div>
          <div className="text-xs text-white/30">
            {hovered.oldest_label} &rarr; {hovered.youngest_label}
          </div>
          <div className="mt-1 text-xs text-accent">Click to explore &rarr;</div>
        </div>
      )}
    </div>
  );
}
