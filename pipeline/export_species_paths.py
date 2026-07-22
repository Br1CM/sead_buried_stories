"""Exports the 'Species Path' story: for each curated taxon, an ordered trace of the
dated sites where it was found, oldest to most recent.

Usage: venv\\Scripts\\python.exe export_species_paths.py [--limit N] [--skip-images]
"""
import argparse
import json
import os
import time

import pandas as pd

from config import WEB_DATA_DIR
from dating import calendar_label
from db import get_engine, query
from gbif_media import load_gbif_keys, load_media_cache, resolve_species_media, save_media_cache

CANDIDATE_SQL = """
with candidate as (
  select tm.taxon_id, tg.genus_name, tm.species,
         min(cn.common_name) as common_name_local
  from tbl_taxa_tree_master tm
  join tbl_taxa_tree_genera tg on tg.genus_id = tm.genus_id
  left join tbl_taxa_common_names cn on cn.taxon_id = tm.taxon_id
  where tm.species !~* '\\y(sp|spp|indet|cf|aff)\\.?\\y'
    and tm.species !~* '\\(grp\\)|ssp\\.|subsp\\.|var\\.|×|/'
  group by tm.taxon_id, tg.genus_name, tm.species
)
-- Only taxa with real chronometric (numeric-year) dated finds make a meaningful map trace;
-- taxa dated solely via relative/period labels (mostly crop plants from Swedish excavation
-- sites, confirmed to have zero overlap with the chronometric set in this snapshot) are
-- excluded here, not because they're uninteresting but because there's no numeric age to
-- order a path by.
select c.taxon_id, c.genus_name, c.species, c.common_name_local,
       count(distinct psd.site_id) as n_sites,
       count(distinct loc.location_name) as n_countries,
       count(*) as n_finds
from candidate c
join tbl_abundances ab on ab.taxon_id = c.taxon_id
join tbl_analysis_entities ae on ae.analysis_entity_id = ab.analysis_entity_id
join sead_utility.physical_sample_dating psd on psd.physical_sample_id = ae.physical_sample_id
left join tbl_site_locations sl on sl.site_id = psd.site_id
left join tbl_locations loc on loc.location_id = sl.location_id and loc.location_type_id = 1
where psd.latitude_dd is not null
  and psd.age_older is not null and psd.age_younger is not null
group by c.taxon_id, c.genus_name, c.species, c.common_name_local
having count(distinct psd.site_id) >= 2
order by n_sites desc
"""

TOP_COUNTRIES_COUNT = 10

PATH_SQL = """
select psd.site_id, psd.site_name, psd.latitude_dd, psd.longitude_dd,
       max(psd.age_older) as age_older, min(psd.age_younger) as age_younger,
       count(*) as n_finds
from tbl_abundances ab
join tbl_analysis_entities ae on ae.analysis_entity_id = ab.analysis_entity_id
join sead_utility.physical_sample_dating psd on psd.physical_sample_id = ae.physical_sample_id
where ab.taxon_id = :taxon_id and psd.latitude_dd is not null
  and psd.age_older is not null and psd.age_younger is not null
group by psd.site_id, psd.site_name, psd.latitude_dd, psd.longitude_dd
order by age_older desc
"""

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--skip-images", action="store_true")
    args = parser.parse_args()

    engine = get_engine()
    all_candidates = query(engine, CANDIDATE_SQL)

    top_by_sites = all_candidates.head(args.limit)
    top_by_countries = all_candidates.sort_values("n_countries", ascending=False).head(
        TOP_COUNTRIES_COUNT
    )
    candidates = (
        pd.concat([top_by_sites, top_by_countries])
        .drop_duplicates(subset="taxon_id")
        .reset_index(drop=True)
    )
    print(
        f"Curated {len(candidates)} taxa "
        f"({len(top_by_sites)} most-studied + up to {TOP_COUNTRIES_COUNT} most-widespread by country)"
    )

    gbif_keys = load_gbif_keys() if not args.skip_images else {}
    media_cache = load_media_cache()

    species_dir = os.path.join(WEB_DATA_DIR, "species")
    os.makedirs(species_dir, exist_ok=True)

    index = []
    for row in candidates.itertuples():
        scientific_name = f"{row.genus_name} {row.species}"
        cache_key = str(row.taxon_id)

        if args.skip_images:
            media = {"image": None, "common_name_en": None}
        elif cache_key in media_cache:
            media = media_cache[cache_key]
        else:
            media = resolve_species_media(row.taxon_id, scientific_name, gbif_keys)
            media_cache[cache_key] = media
            save_media_cache(media_cache)
            time.sleep(0.2)

        path_df = query(engine, PATH_SQL, {"taxon_id": int(row.taxon_id)})
        path = [
            {
                "site_id": int(p.site_id),
                "site_name": p.site_name,
                "lat": float(p.latitude_dd),
                "lon": float(p.longitude_dd),
                "age_older_bp": float(p.age_older),
                "age_younger_bp": float(p.age_younger),
                "label": calendar_label((p.age_older + p.age_younger) / 2),
                "n_finds": int(p.n_finds),
            }
            for p in path_df.itertuples()
        ]

        common_name_en = media.get("common_name_en")
        entry = {
            "taxon_id": int(row.taxon_id),
            "scientific_name": scientific_name,
            "common_name_en": common_name_en,
            "common_name_local": row.common_name_local,
            "n_sites": int(row.n_sites),
            "n_countries": int(row.n_countries),
            "n_finds": int(row.n_finds),
            "image": media.get("image"),
            "oldest_label": path[0]["label"] if path else None,
            "youngest_label": path[-1]["label"] if path else None,
        }
        index.append(entry)

        with open(os.path.join(species_dir, f"{row.taxon_id}.json"), "w", encoding="utf-8") as f:
            json.dump({**entry, "path": path}, f, ensure_ascii=False, indent=2)

        print(f"  {scientific_name} ({common_name_en or row.common_name_local}): "
              f"{len(path)} sites, image={'yes' if media.get('image') else 'no'}")

    with open(os.path.join(species_dir, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    if not args.skip_images:
        save_media_cache(media_cache)

    print(f"Wrote {len(index)} species to {species_dir}")


if __name__ == "__main__":
    main()
