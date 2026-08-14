"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import Map, { Marker, Source, Layer, MapRef } from "react-map-gl/maplibre";
import type { LngLatBoundsLike } from "maplibre-gl";
import { osmRasterStyle } from "@/lib/basemap";
import type { SisterCluster } from "@/lib/types";

export function SisterBuildingsMap({ cluster }: { cluster: SisterCluster }) {
  const mapRef = useRef<MapRef | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    const lons = [cluster.origin_lon, ...cluster.sites.map((s) => s.lon)];
    const lats = [cluster.origin_lat, ...cluster.sites.map((s) => s.lat)];
    const bounds: LngLatBoundsLike = [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ];
    map.fitBounds(bounds, { padding: 70, duration: 300, maxZoom: 9 });
  }, [cluster, isLoaded]);

  const linesGeoJson = {
    type: "FeatureCollection" as const,
    features: cluster.sites.map((s) => ({
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [cluster.origin_lon, cluster.origin_lat],
          [s.lon, s.lat],
        ],
      },
      properties: {},
    })),
  };

  return (
    <Map
      ref={mapRef}
      mapStyle={osmRasterStyle}
      initialViewState={{ longitude: cluster.origin_lon, latitude: cluster.origin_lat, zoom: 5 }}
      style={{ width: "100%", height: "100%" }}
      onLoad={() => setIsLoaded(true)}
    >
      {isLoaded && (
        <Source id="fan-lines" type="geojson" data={linesGeoJson}>
          <Layer
            id="fan-lines-layer"
            type="line"
            paint={{ "line-color": "#e8863d", "line-width": 2, "line-opacity": 0.7, "line-dasharray": [2, 2] }}
            layout={{ "line-cap": "round" }}
          />
        </Source>
      )}

      <Marker longitude={cluster.origin_lon} latitude={cluster.origin_lat} anchor="center">
        <div className="flex flex-col items-center">
          <div className="h-4 w-4 rounded-full border-2 border-white bg-accent" />
        </div>
      </Marker>

      {cluster.sites.map((s) => (
        <Marker key={s.site_id} longitude={s.lon} latitude={s.lat} anchor="center">
          <div
            className="h-3 w-3 rounded-full border-2 border-white/60 bg-accent-soft"
            title={`${s.site_name} — ${s.distance_km} km from ${cluster.provenance}`}
          />
        </Marker>
      ))}
    </Map>
  );
}
