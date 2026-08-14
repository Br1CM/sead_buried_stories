"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef } from "react";
import Map, { Source, Layer, Marker, MapRef } from "react-map-gl/maplibre";
import type { LngLatBoundsLike } from "maplibre-gl";
import { osmRasterStyle } from "@/lib/basemap";
import type { SpeciesPathStop } from "@/lib/types";

interface MapTraceProps {
  stops: SpeciesPathStop[];
  activeIndex: number;
}

export function MapTrace({ stops, activeIndex }: MapTraceProps) {
  const mapRef = useRef<MapRef | null>(null);

  const revealed = stops.slice(0, activeIndex + 1);

  const lineGeoJson = useMemo(
    () => ({
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: revealed.map((s) => [s.lon, s.lat]),
      },
      properties: {},
    }),
    [revealed]
  );

  // Dynamic zoom: reframe the map to fit only the stops revealed so far, so the
  // view grows outward as the timeline advances instead of showing every site upfront.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || revealed.length === 0) return;

    if (revealed.length === 1) {
      map.flyTo({ center: [revealed[0].lon, revealed[0].lat], zoom: 6, duration: 800 });
      return;
    }

    const lons = revealed.map((s) => s.lon);
    const lats = revealed.map((s) => s.lat);
    const bounds: LngLatBoundsLike = [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ];
    map.fitBounds(bounds, { padding: 80, duration: 800, maxZoom: 12 });
  }, [activeIndex, revealed]);

  return (
    <Map
      ref={mapRef}
      mapStyle={osmRasterStyle}
      initialViewState={{ longitude: stops[0]?.lon ?? 10, latitude: stops[0]?.lat ?? 55, zoom: 5 }}
      style={{ width: "100%", height: "100%" }}
    >
      {revealed.length >= 2 && (
        <Source id="path" type="geojson" data={lineGeoJson}>
          <Layer
            id="path-line"
            type="line"
            paint={{ "line-color": "#e8863d", "line-width": 3, "line-opacity": 0.8 }}
            layout={{ "line-cap": "round", "line-join": "round" }}
          />
        </Source>
      )}
      {revealed.map((s, i) => {
        const isActive = i === activeIndex;
        return (
          <Marker key={`${s.site_id}-${i}`} longitude={s.lon} latitude={s.lat} anchor="center">
            <div
              className="rounded-full border-2 transition-all"
              style={{
                width: isActive ? 16 : 10,
                height: isActive ? 16 : 10,
                background: isActive ? "#e8863d" : "#c76a35",
                borderColor: isActive ? "#fff" : "rgba(43,28,17,0.5)",
              }}
              title={`${s.site_name} — ${s.label}`}
            />
          </Marker>
        );
      })}
    </Map>
  );
}
