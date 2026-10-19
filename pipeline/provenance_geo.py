"""Geography for the dendrochronology "Provenance" values that appear in the Sister
Buildings clusters (see export_timber_sisters.py). SEAD stores provenance as free-text
region names, not coordinates, so there's nothing in the database to join against.

Provenance values that are real Swedish historical provinces (landskap) get their actual
boundary polygon from data/svenska_landskap_klippt.geojson -- the coastline-clipped version
of the 25-province dataset published by https://github.com/perliedman/svenska-landskap
(CC0, built from Lantmateriet's Distriktskarta). All 25 provinces are loaded, so any site
can be placed in its province (see site_landskap), not just the provenance regions.

Two values ("Ostra Svealand", "Malardalen/Stockholms skargard") are informal,
multi-province groupings researchers wrote in the free-text field -- they don't correspond
to any official boundary, so there's no polygon to load. For those we fall back to a
circle sized to a hand-estimated area (see APPROX_AREA_KM2 below); it's a visual proxy,
not a claim about a real boundary.

Other free-text values (sub-regions like "Norra Smaland", alternatives like "Smaland eller
Gotland", "Uppland eller dess angransande landskap", ...) have no shape here; extend
PROVENANCE_CENTROIDS/APPROX_AREA_KM2 if one of them is ever needed.
"""
import json
import math
import os

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
LANDSKAP_GEOJSON = os.path.join(DATA_DIR, "svenska_landskap_klippt.geojson")

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

# The province polygons are clipped to a coarse coastline, so harbour, island and
# archipelago sites (Kalmar's old town, Stockholm's islands, ...) can fall a few km into the
# "sea". Sites within this distance of a province are snapped to the nearest one.
COAST_SNAP_KM = 10.0


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


def _load_landskap_geometries() -> dict[str, dict]:
    with open(LANDSKAP_GEOJSON, encoding="utf-8") as f:
        data = json.load(f)
    return {feature["properties"]["landskap"]: feature["geometry"] for feature in data["features"]}


# Full-detail geometries, used for point-in-province tests.
_LANDSKAP_GEOMETRIES = _load_landskap_geometries()


def _load_landskap_shapes() -> dict[str, dict]:
    shapes = {}
    for name, geometry in _LANDSKAP_GEOMETRIES.items():
        lat_c, lon_c = _bbox_centroid(geometry)
        area = _polygon_area_km2(geometry, lat_c)
        shapes[name] = {
            "kind": "landskap",
            "name": name,
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


def _point_in_ring(lon: float, lat: float, ring: list) -> bool:
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def _geometry_contains(geometry: dict, lat: float, lon: float) -> bool:
    polygons = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
    for rings in polygons:
        if _point_in_ring(lon, lat, rings[0]) and not any(_point_in_ring(lon, lat, h) for h in rings[1:]):
            return True
    return False


def _distance_to_geometry_km(geometry: dict, lat: float, lon: float) -> float:
    """Distance to the nearest boundary vertex (the clipped data is dense enough for a snap test)."""
    kx = 111.32 * math.cos(math.radians(lat))
    best = math.inf
    polygons = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
    for rings in polygons:
        for ring in rings:
            for x, y in ring:
                d = ((x - lon) * kx) ** 2 + ((y - lat) * 110.57) ** 2
                if d < best:
                    best = d
    return math.sqrt(best)


def site_landskap(lat: float, lon: float) -> str | None:
    """The province a site lies in, snapping coastal sites that fall just outside the clipped
    polygons to the nearest province (within COAST_SNAP_KM); None if nothing is that close."""
    for name, geometry in _LANDSKAP_GEOMETRIES.items():
        if _geometry_contains(geometry, lat, lon):
            return name
    best_name, best_km = None, COAST_SNAP_KM
    for name, geometry in _LANDSKAP_GEOMETRIES.items():
        d = _distance_to_geometry_km(geometry, lat, lon)
        if d <= best_km:
            best_name, best_km = name, d
    return best_name


def shape_contains(shape: dict, lat: float, lon: float) -> bool:
    """Whether a site lies inside a provenance shape: for a real province, whether the site's
    own province (coast-snapped, see site_landskap) is that province; for an approximate
    circle, a plain point-in-polygon test."""
    if shape["kind"] == "landskap":
        return site_landskap(lat, lon) == shape["name"]
    return _geometry_contains(shape["geometry"], lat, lon)
