"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import Map, { Marker, MapRef } from "react-map-gl/maplibre";
import type { LngLatBoundsLike } from "maplibre-gl";
import { osmRasterStyle } from "@/lib/basemap";
import type { CeramicsSite } from "@/lib/types";

export function CeramicsMap({ sites }: { sites: CeramicsSite[] }) {
  const mapRef = useRef<MapRef | null>(null);
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
      mapStyle={osmRasterStyle}
      initialViewState={{ longitude: 15, latitude: 58, zoom: 4 }}
      style={{ width: "100%", height: "100%" }}
    >
      {sites.map((s) => {
        const size = 8 + 16 * (s.n_samples / maxSamples);
        return (
          <Marker key={s.site_id} longitude={s.lon} latitude={s.lat} anchor="center">
            <div
              className="rounded-full border-2 border-white/60 bg-accent/80 transition-all"
              style={{ width: size, height: size }}
              title={`${s.site_name} — ${s.n_samples} samples`}
            />
          </Marker>
        );
      })}
    </Map>
  );
}
