"""Exports 'Sister Buildings': groups of buildings whose timber was cut from the same
forest region in the same few years -- likely the same felling batch, possibly the same
shipment -- surfaced as a connective story, especially striking when the buildings
themselves ended up far apart.

Usage: venv\\Scripts\\python.exe export_timber_sisters.py [--skip-images]
"""
import argparse
import json
import math
import os

from config import WEB_DATA_DIR
from dating import ad_label
from db import get_engine, query
from place_photos import get_cached_site_photo, load_photo_cache, save_photo_cache
from provenance_geo import get_origin_shape, shape_contains

YEAR_WINDOW = 5  # cluster felling years within this many years of each other

SAMPLES_SQL = """
with fy as (
  select ae1.physical_sample_id,
         coalesce(
           max(case when dlf.name='Estimated felling year' then fy1.age_older end),
           max(case when dlf.name='Outermost tree-ring date' then fy1.age_older end),
           max(case when dlf.name='Possible estimated felling year' then fy1.age_older end)
         ) as best_year
  from tbl_dendro_dates fy1
  join tbl_dendro_lookup dlf on dlf.dendro_lookup_id = fy1.dendro_lookup_id
  join tbl_analysis_entities ae2 on ae2.analysis_entity_id = fy1.analysis_entity_id
  join tbl_analysis_entities ae1 on ae1.physical_sample_id = ae2.physical_sample_id
  group by ae1.physical_sample_id
),
provenance as (
  select ps.physical_sample_id, min(prov.measurement_value) as provenance
  from tbl_physical_samples ps
  join tbl_analysis_entities ae on ae.physical_sample_id = ps.physical_sample_id
  join tbl_dendro prov on prov.analysis_entity_id = ae.analysis_entity_id
  join tbl_dendro_lookup dl on dl.dendro_lookup_id = prov.dendro_lookup_id and dl.name = 'Provenance'
  group by ps.physical_sample_id
),
species as (
  select ps.physical_sample_id, min(sp.measurement_value) as species
  from tbl_physical_samples ps
  join tbl_analysis_entities ae on ae.physical_sample_id = ps.physical_sample_id
  join tbl_dendro sp on sp.analysis_entity_id = ae.analysis_entity_id
  join tbl_dendro_lookup dl on dl.dendro_lookup_id = sp.dendro_lookup_id and dl.name = 'Tree species'
  group by ps.physical_sample_id
)
select fy.physical_sample_id, fy.best_year, provenance.provenance, species.species,
       s.site_id, s.site_name, s.latitude_dd, s.longitude_dd
from fy
join provenance on provenance.physical_sample_id = fy.physical_sample_id
left join species on species.physical_sample_id = fy.physical_sample_id
join tbl_physical_samples ps on ps.physical_sample_id = fy.physical_sample_id
join tbl_sample_groups sg on sg.sample_group_id = ps.sample_group_id
join tbl_sites s on s.site_id = sg.site_id
where fy.best_year is not null and s.latitude_dd is not null
  and provenance.provenance not in ('Lokalt', 'Undefined')
"""

SPECIES_LABELS = {
    "Tall": "Pine", "Ek": "Oak", "Gran": "Spruce", "Ask": "Ash",
    "Bok": "Beech", "Björk": "Birch", "Lind": "Linden", "Lärk": "Larch",
}


def haversine_km(lat1, lon1, lat2, lon2):
    r = 6371
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def felling_windows(group):
    """Every maximal set of 2+ sites whose timbers were felled within YEAR_WINDOW years of each
    other. A sliding window rather than fixed year buckets, so a pair felled in 1784 and 1786
    isn't split across a bucket boundary. Returns one sub-frame of `group` per window."""
    windows = []
    for start in sorted(group["best_year"].unique()):
        window = group[(group["best_year"] >= start) & (group["best_year"] <= start + YEAR_WINDOW)]
        sites = frozenset(window["site_id"])
        if len(sites) >= 2:
            windows.append((sites, window))
    maximal = []
    for sites, window in windows:
        if any(sites < other for other, _ in windows) or any(sites == kept for kept, _ in maximal):
            continue
        maximal.append((sites, window))
    return [window for _, window in maximal]


def build_cluster(provenance, shape, centroid, group):
    """One felling window as a cluster, or None if it breaks the travelled-timber rule."""
    sites = []
    for site_id, sg in group.groupby("site_id"):
        first = sg.sort_values("best_year").iloc[0]
        species_local = first["species"] if isinstance(first["species"], str) else None
        sites.append(
            {
                "site_id": int(site_id),
                "site_name": first["site_name"],
                "lat": float(first["latitude_dd"]),
                "lon": float(first["longitude_dd"]),
                "felling_year": int(first["best_year"]),
                "label": ad_label(first["best_year"]),
                "species_local": species_local,
                "species_en": SPECIES_LABELS.get(species_local),
                "distance_km": round(
                    haversine_km(
                        centroid[0], centroid[1], float(first["latitude_dd"]), float(first["longitude_dd"])
                    )
                ),
            }
        )
    # Sisters that never left their home region tell no "travelled timber" story --
    # keep a cluster only if at least one building lies outside the provenance area.
    if all(shape_contains(shape, s["lat"], s["lon"]) for s in sites):
        return None
    sites.sort(key=lambda s: s["distance_km"], reverse=True)
    max_distance = sites[0]["distance_km"]

    # The window's midpoint stands in for "around <year>" in the UI and keys the cluster.
    year_mid = round((group["best_year"].min() + group["best_year"].max()) / 2)
    return {
        "provenance": provenance,
        "origin_lat": centroid[0],
        "origin_lon": centroid[1],
        "origin_shape_kind": shape["kind"],
        "year_bucket": int(year_mid),
        "label": ad_label(year_mid),
        "n_sites": len(sites),
        "max_distance_km": max_distance,
        "sites": sites,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-images", action="store_true")
    args = parser.parse_args()

    engine = get_engine()
    df = query(engine, SAMPLES_SQL)
    print(f"{len(df)} non-local-provenance dated timbers")

    photo_cache = load_photo_cache()
    sisters_dir = os.path.join(WEB_DATA_DIR, "timber-sisters")
    os.makedirs(sisters_dir, exist_ok=True)

    clusters = []
    shapes_used = {}
    for provenance, prov_group in df.groupby("provenance"):
        shape = get_origin_shape(provenance)
        if shape is None:
            continue
        centroid = shape["centroid"]

        for group in felling_windows(prov_group):
            cluster = build_cluster(provenance, shape, centroid, group)
            if cluster is not None:
                shapes_used[provenance] = shape
                clusters.append(cluster)

    clusters.sort(key=lambda c: c["max_distance_km"], reverse=True)

    for cluster in clusters:
        for site in cluster["sites"]:
            photo = (
                None
                if args.skip_images
                else get_cached_site_photo(site["site_name"], photo_cache, langs=("sv", "en"))
            )
            site["photo"] = photo

    if not args.skip_images:
        save_photo_cache(photo_cache)

    with open(os.path.join(sisters_dir, "index.json"), "w", encoding="utf-8") as f:
        json.dump(clusters, f, ensure_ascii=False, indent=2)

    shapes_out = {
        provenance: {
            "kind": shape["kind"],
            "geometry": shape["geometry"],
            "area_km2": shape["area_km2"],
        }
        for provenance, shape in shapes_used.items()
    }
    with open(os.path.join(sisters_dir, "provenance-shapes.json"), "w", encoding="utf-8") as f:
        json.dump(shapes_out, f, ensure_ascii=False, indent=2)

    for c in clusters:
        print(f"  {c['provenance']} ~{c['label']}: {c['n_sites']} sites, "
              f"up to {c['max_distance_km']} km from origin -- {', '.join(s['site_name'] for s in c['sites'])}")

    print(f"Wrote {len(clusters)} clusters and {len(shapes_out)} provenance shapes to {sisters_dir}")


if __name__ == "__main__":
    main()
