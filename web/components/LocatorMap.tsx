"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import Map, { Marker } from "react-map-gl/maplibre";
import { osmRasterStyle } from "@/lib/basemap";

export function LocatorMap({ lat, lon, label }: { lat: number; lon: number; label: string }) {
  return (
    <Map
      mapStyle={osmRasterStyle}
      initialViewState={{ longitude: lon, latitude: lat, zoom: 8 }}
      style={{ width: "100%", height: "100%" }}
    >
      <Marker longitude={lon} latitude={lat} anchor="center">
        <div
          className="h-4 w-4 rounded-full border-2 border-white bg-accent"
          title={label}
        />
      </Marker>
    </Map>
  );
}
