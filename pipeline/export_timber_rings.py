"""Exports 'Rings of a Building': for each curated historic building, every individually
dated timber in it, ordered oldest to newest -- a construction/repair biography told through
dendrochronology instead of documents.

Usage: venv\\Scripts\\python.exe export_timber_rings.py [--limit N] [--skip-images]
"""
import argparse
import json
import os

from config import WEB_DATA_DIR
from dating import ad_label
from db import get_engine, query
from place_photos import get_cached_site_photo, load_photo_cache, save_photo_cache

CANDIDATES_SQL = """
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
)
select s.site_id, s.site_name, s.latitude_dd, s.longitude_dd,
       count(distinct fy.best_year) as n_distinct_years,
       count(distinct fy.physical_sample_id) as n_samples
from fy
join tbl_physical_samples ps on ps.physical_sample_id = fy.physical_sample_id
join tbl_sample_groups sg on sg.sample_group_id = ps.sample_group_id
join tbl_sites s on s.site_id = sg.site_id
where fy.best_year is not null and s.latitude_dd is not null
group by s.site_id, s.site_name, s.latitude_dd, s.longitude_dd
having count(distinct fy.best_year) >= 6
order by n_distinct_years desc
"""

BUILDING_TIMBERS_SQL = """
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
species as (
  select ps.physical_sample_id, min(sp.measurement_value) as species
  from tbl_physical_samples ps
  join tbl_analysis_entities ae on ae.physical_sample_id = ps.physical_sample_id
  join tbl_dendro sp on sp.analysis_entity_id = ae.analysis_entity_id
  join tbl_dendro_lookup dl on dl.dendro_lookup_id = sp.dendro_lookup_id and dl.name = 'Tree species'
  group by ps.physical_sample_id
),
waney as (
  select ps.physical_sample_id, bool_or(w.measurement_value = 'W') as has_waney
  from tbl_physical_samples ps
  join tbl_analysis_entities ae on ae.physical_sample_id = ps.physical_sample_id
  join tbl_dendro w on w.analysis_entity_id = ae.analysis_entity_id
  join tbl_dendro_lookup dl on dl.dendro_lookup_id = w.dendro_lookup_id and dl.name = 'Waney edge (W)'
  group by ps.physical_sample_id
)
select fy.physical_sample_id, fy.best_year, species.species, coalesce(waney.has_waney, false) as has_waney
from fy
join tbl_physical_samples ps on ps.physical_sample_id = fy.physical_sample_id
join tbl_sample_groups sg on sg.sample_group_id = ps.sample_group_id
left join species on species.physical_sample_id = fy.physical_sample_id
left join waney on waney.physical_sample_id = fy.physical_sample_id
where sg.site_id = :site_id and fy.best_year is not null
order by fy.best_year
"""

SPECIES_LABELS = {
    "Tall": "Pine", "Ek": "Oak", "Gran": "Spruce", "Ask": "Ash",
    "Bok": "Beech", "Björk": "Birch", "Lind": "Linden", "Lärk": "Larch",
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=25)
    parser.add_argument("--skip-images", action="store_true")
    args = parser.parse_args()

    engine = get_engine()
    candidates = query(engine, CANDIDATES_SQL).head(args.limit)
    print(f"Curated {len(candidates)} buildings")

    photo_cache = load_photo_cache()
    rings_dir = os.path.join(WEB_DATA_DIR, "timber-rings")
    os.makedirs(rings_dir, exist_ok=True)

    index = []
    for row in candidates.itertuples():
        timbers_df = query(engine, BUILDING_TIMBERS_SQL, {"site_id": int(row.site_id)})

        years = []
        for year, group in timbers_df.groupby("best_year"):
            species_local = sorted({s for s in group["species"] if isinstance(s, str)})
            years.append(
                {
                    "year": int(year),
                    "label": ad_label(year),
                    "species_local": species_local,
                    "species_en": [SPECIES_LABELS.get(s, s) for s in species_local],
                    "has_waney": bool(group["has_waney"].any()),
                    "n_samples": int(len(group)),
                }
            )
        years.sort(key=lambda y: y["year"])

        photo = (
            None
            if args.skip_images
            else get_cached_site_photo(row.site_name, photo_cache, langs=("sv", "en"))
        )

        entry = {
            "site_id": int(row.site_id),
            "site_name": row.site_name,
            "lat": float(row.latitude_dd),
            "lon": float(row.longitude_dd),
            "n_samples": int(row.n_samples),
            "n_years": len(years),
            "earliest_label": years[0]["label"] if years else None,
            "latest_label": years[-1]["label"] if years else None,
            "photo": photo,
        }
        index.append(entry)

        with open(os.path.join(rings_dir, f"{row.site_id}.json"), "w", encoding="utf-8") as f:
            json.dump({**entry, "years": years}, f, ensure_ascii=False, indent=2)

        print(f"  {row.site_name}: {len(years)} dated years "
              f"({entry['earliest_label']} - {entry['latest_label']}), "
              f"photo={'yes' if photo else 'no'}")

    if not args.skip_images:
        save_photo_cache(photo_cache)

    with open(os.path.join(rings_dir, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(index)} buildings to {rings_dir}")


if __name__ == "__main__":
    main()
