"""Geography for the dendrochronology "Provenance" values that appear in the Sister
Buildings clusters (see export_timber_sisters.py). SEAD stores provenance as free-text
region names, not coordinates, so there's nothing in the database to join against.

Five of the seven provenance values used by the Sister Buildings feature are real
Swedish historical provinces (landskap), for which we have an actual boundary polygon --
data/svenska_landskap_subset.geojson, a trimmed copy of the 25-province dataset published
by https://github.com/perliedman/svenska-landskap (CC0, built from Lantmateriet's
Distriktskarta). For those, get_origin_shape() returns the real polygon.

The other two values ("Ostra Svealand", "Malardalen/Stockholms skargard") are informal,
multi-province groupings researchers wrote in the free-text field -- they don't correspond
to any official boundary, so there's no polygon to load. For those we fall back to a
circle sized to a hand-estimated area (see APPROX_AREA_KM2 below); it's a visual proxy,
not a claim about a real boundary.

Only covers the provinces that actually appear in the Sister Buildings clusters; extend
PROVENANCE_CENTROIDS/APPROX_AREA_KM2 or the geojson subset if broader coverage is needed.
"""
import json
import math
import os

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
LANDSKAP_GEOJSON = os.path.join(DATA_DIR, "svenska_landskap_subset.geojson")

# Hand-picked fallback centroids, used only for provenance values with no polygon
# (real landskap get their centroid computed from the polygon instead, see below).
PROVENANCE_CENTROIDS: dict[str, tuple[float, float]] = {
    "Östra Svealand": (59.3, 18.0),
    "Mälardalen/Stockholms skärgård": (59.3, 18.5),
}

# No official boundary exists for these informal, multi-province region names, so these
# are rough eyeballed areas (roughly landskap-sized), only used to size the fallback
# circle so it isn't a single point. Not derived from any source -- treat as approximate.
APPROX_AREA_KM2: dict[str, float] = {
    "Östra Svealand": 8000.0,
    "Mälardalen/Stockholms skärgård": 5000.0,
}

EARTH_R_KM = 6371.0


def _ring_area_km2(ring: list[tuple[float, float]], lat0: float) -> float:
    lat0r = math.radians(lat0)
    pts = [
        (math.radians(lon) * math.cos(lat0r) * EARTH_R_KM, math.radians(lat) * EARTH_R_KM)
        for lon, lat in ring
    ]
    area = 0.0
    n = len(pts)
    for i in range(n):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % n]
        area += x1 * y2 - x2 * y1
    return abs(area) / 2


def _polygon_area_km2(geometry: dict, lat0: float) -> float:
    if geometry["type"] == "Polygon":
        rings = geometry["coordinates"]
        area = _ring_area_km2(rings[0], lat0)
        for hole in rings[1:]:
            area -= _ring_area_km2(hole, lat0)
        return area
    if geometry["type"] == "MultiPolygon":
        return sum(_polygon_area_km2({"type": "Polygon", "coordinates": poly}, lat0) for poly in geometry["coordinates"])
    return 0.0


def _perp_dist(p, a, b) -> float:
    if a == b:
        return math.hypot(p[0] - a[0], p[1] - a[1])
    x1, y1 = a
    x2, y2 = b
    x0, y0 = p
    num = abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
    den = math.hypot(y2 - y1, x2 - x1)
    return num / den


def _rdp(points: list, tolerance_deg: float) -> list:
    """Ramer-Douglas-Peucker simplification (no external deps)."""
    if len(points) < 3:
        return points
    dmax, index = 0.0, 0
    for i in range(1, len(points) - 1):
        d = _perp_dist(points[i], points[0], points[-1])
        if d > dmax:
            dmax, index = d, i
    if dmax > tolerance_deg:
        left = _rdp(points[: index + 1], tolerance_deg)
        right = _rdp(points[index:], tolerance_deg)
        return left[:-1] + right
    return [points[0], points[-1]]


def _simplify_geometry(geometry: dict, tolerance_deg: float = 0.01) -> dict:
    if geometry["type"] == "Polygon":
        rings = [_rdp(ring, tolerance_deg) for ring in geometry["coordinates"]]
        return {"type": "Polygon", "coordinates": rings}
    if geometry["type"] == "MultiPolygon":
        polys = [[_rdp(ring, tolerance_deg) for ring in poly] for poly in geometry["coordinates"]]
        return {"type": "MultiPolygon", "coordinates": polys}
    return geometry


def _bbox_centroid(geometry: dict) -> tuple[float, float]:
    lons: list[float] = []
    lats: list[float] = []

    def walk(coords):
        if isinstance(coords[0], (float, int)):
            lons.append(coords[0])
            lats.append(coords[1])
        else:
            for c in coords:
                walk(c)

    walk(geometry["coordinates"])
    return (sum(lats) / len(lats), sum(lons) / len(lons))


def _circle_polygon(lat: float, lon: float, radius_km: float, n: int = 64) -> dict:
    """Approximate a circle of the given radius as a GeoJSON Polygon (spherical destination-point)."""
    lat0, lon0 = math.radians(lat), math.radians(lon)
    ang = radius_km / EARTH_R_KM
    coords = []
    for i in range(n + 1):
        bearing = 2 * math.pi * i / n
        lat_i = math.asin(math.sin(lat0) * math.cos(ang) + math.cos(lat0) * math.sin(ang) * math.cos(bearing))
        lon_i = lon0 + math.atan2(
            math.sin(bearing) * math.sin(ang) * math.cos(lat0),
            math.cos(ang) - math.sin(lat0) * math.sin(lat_i),
        )
        coords.append([math.degrees(lon_i), math.degrees(lat_i)])
    return {"type": "Polygon", "coordinates": [coords]}


def _load_landskap_shapes() -> dict[str, dict]:
    with open(LANDSKAP_GEOJSON, encoding="utf-8") as f:
        data = json.load(f)
    shapes = {}
    for feature in data["features"]:
        name = feature["properties"]["landskap"]
        geometry = feature["geometry"]
        lat_c, lon_c = _bbox_centroid(geometry)
        area = _polygon_area_km2(geometry, lat_c)
        shapes[name] = {
            "kind": "landskap",
            # Simplified for map rendering -- area/centroid above are computed from the
            # full-detail source geometry, before simplification.
            "geometry": _simplify_geometry(geometry, tolerance_deg=0.01),
            "area_km2": round(area),
            "centroid": (lat_c, lon_c),
        }
    return shapes


_LANDSKAP_SHAPES = _load_landskap_shapes()


def get_origin_shape(provenance: str) -> dict | None:
    """Returns {kind, geometry, area_km2, centroid} for a provenance value, or None if unknown."""
    if provenance in _LANDSKAP_SHAPES:
        return _LANDSKAP_SHAPES[provenance]
    if provenance in PROVENANCE_CENTROIDS:
        lat, lon = PROVENANCE_CENTROIDS[provenance]
        area = APPROX_AREA_KM2[provenance]
        radius_km = math.sqrt(area / math.pi)
        return {
            "kind": "approx_circle",
            "geometry": _circle_polygon(lat, lon, radius_km),
            "area_km2": round(area),
            "centroid": (lat, lon),
        }
    return None


def get_centroid(provenance: str) -> tuple[float, float] | None:
    shape = get_origin_shape(provenance)
    return shape["centroid"] if shape else None
