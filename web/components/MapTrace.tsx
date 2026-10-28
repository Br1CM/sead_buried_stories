"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Source, Layer, Marker, MapRef } from "react-map-gl/maplibre";
import type { LngLatBoundsLike } from "maplibre-gl";
import { buffer, convex, featureCollection, lineString, point, points } from "@turf/turf";
import { maplibreLib, osmRasterStyle } from "@/lib/basemap";
import type { SpeciesPathStop } from "@/lib/types";

interface MapTraceProps {
  stops: SpeciesPathStop[];
  activeIndex: number;
}

const SEAD_SITE_URL = "https://staging.sead.se/site/";
// Feathered edge: the hull is drawn several times, each buffered a little further out and
// very faint, so the overlaps build a soft gradient from a denser core to a blurry rim.
const FEATHER_STEPS = [1, 1.3, 1.65, 2, 2.4, 2.85, 3.3, 3.8];
const FEATHER_OPACITY = 0.045;

function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// Smallest convex shape enclosing every revealed site (falling back to a line or a point
// while there are too few sites), so the cloud always covers all places the species was seen.
function hullOf(sites: SpeciesPathStop[]) {
  const coords = sites.map((s) => [s.lon, s.lat]);
  if (coords.length === 1) return point(coords[0]);
  return convex(points(coords)) ?? lineString(coords);
}

export function MapTrace({ stops, activeIndex }: MapTraceProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const revealed = useMemo(() => stops.slice(0, activeIndex + 1), [stops, activeIndex]);

  // Each site is linked in time to the nearest site that appeared before it on the timeline.
  const parents = useMemo(
    () =>
      stops.map((s, i) => {
        let best = -1;
        let bestDist = Infinity;
        for (let j = 0; j < i; j++) {
          const d = distanceKm(stops[j], s);
          if (d < bestDist) {
            bestDist = d;
            best = j;
          }
        }
        return best;
      }),
    [stops]
  );

  const linksGeoJson = useMemo(() => {
    const features: GeoJSON.Feature<GeoJSON.LineString, { age: number; active: boolean }>[] = [];
    revealed.forEach((s, i) => {
      const parent = parents[i];
      if (parent < 0) return;
      const p = stops[parent];
      features.push({
        type: "Feature",
        geometry: { type: "LineString", coordinates: [[p.lon, p.lat], [s.lon, s.lat]] },
        properties: { age: activeIndex > 0 ? i / activeIndex : 1, active: i === activeIndex },
      });
    });
    return { type: "FeatureCollection" as const, features };
  }, [revealed, parents, stops, activeIndex]);

  // Feather width in km, fixed per species (from the full extent of its sites) so the rim
  // keeps the same softness as the cloud grows along the timeline.
  const featherKm = useMemo(() => {
    if (stops.length < 2) return 25;
    const lats = stops.map((s) => s.lat);
    const lons = stops.map((s) => s.lon);
    const diag = distanceKm(
      { lat: Math.min(...lats), lon: Math.min(...lons) },
      { lat: Math.max(...lats), lon: Math.max(...lons) }
    );
    return Math.min(60, Math.max(12, diag * 0.025));
  }, [stops]);

  const spreadGeoJson = useMemo(() => {
    if (revealed.length === 0) return featureCollection([]);
    const hull = hullOf(revealed);
    const rings = FEATHER_STEPS.map((k) => buffer(hull, featherKm * k, { units: "kilometers", steps: 16 })).filter(
      (f) => f !== undefined
    );
    return featureCollection(rings);
  }, [revealed, featherKm]);

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
  }, [revealed]);

  return (
    <Map
      ref={mapRef}
      mapLib={maplibreLib}
      mapStyle={osmRasterStyle}
      initialViewState={{ longitude: stops[0]?.lon ?? 10, latitude: stops[0]?.lat ?? 55, zoom: 5 }}
      style={{ width: "100%", height: "100%" }}
    >
      <Source id="spread" type="geojson" data={spreadGeoJson}>
        <Layer
          id="spread-area"
          type="fill"
          paint={{ "fill-color": "#e8863d", "fill-opacity": FEATHER_OPACITY, "fill-antialias": false }}
        />
      </Source>
      <Source id="links" type="geojson" data={linksGeoJson}>
        <Layer
          id="links-past"
          type="line"
          filter={["!", ["get", "active"]]}
          paint={{
            "line-color": "#8a4316",
            "line-width": 2,
            "line-dasharray": [2, 2],
            "line-opacity": ["interpolate", ["linear"], ["get", "age"], 0, 0.45, 1, 0.9],
          }}
        />
        <Layer
          id="links-active"
          type="line"
          filter={["get", "active"]}
          paint={{ "line-color": "#e8863d", "line-width": 3, "line-opacity": 0.95 }}
          layout={{ "line-cap": "round" }}
        />
      </Source>
      {revealed.map((s, i) => {
        const isActive = i === activeIndex;
        const isHovered = i === hoveredIndex;
        return (
          <Marker
            key={`${s.site_id}-${i}`}
            longitude={s.lon}
            latitude={s.lat}
            anchor="center"
            style={{ zIndex: isHovered ? 3 : isActive ? 2 : 1 }}
          >
            <a
              href={`${SEAD_SITE_URL}${s.site_id}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${s.site_name} — open in the SEAD browser`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex((h) => (h === i ? null : h))}
              onFocus={() => setHoveredIndex(i)}
              onBlur={() => setHoveredIndex((h) => (h === i ? null : h))}
              className="relative block cursor-pointer rounded-full border-2 transition-all"
              style={{
                width: isActive || isHovered ? 16 : 10,
                height: isActive || isHovered ? 16 : 10,
                background: isActive || isHovered ? "#e8863d" : "#c76a35",
                borderColor: isActive || isHovered ? "#fff" : "rgba(43,28,17,0.5)",
              }}
            >
              {isHovered && (
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-cream-10 bg-overlay px-3 py-1.5 text-sm shadow-lg">
                  <span className="block font-medium text-cream-70">{s.site_name}</span>
                  <span className="block text-xs text-cream-30">{s.label}</span>
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
