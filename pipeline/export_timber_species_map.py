"""Exports 'What Sweden Was Built From': every geolocated, species-identified, dated timber
sample, bucketed into 50-year windows -- a map + time scrubber showing which tree species
were used to build, era by era. The data shows a real oak-to-pine shift across the
1500s-1600s; frame it as what got dendro-sampled, not a full census of Swedish forestry.

Usage: venv\\Scripts\\python.exe export_timber_species_map.py
"""
import json
import os

from config import WEB_DATA_DIR
from dating import ad_label
from db import get_engine, query

BUCKET_SIZE = 50

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
species as (
  select ps.physical_sample_id, min(sp.measurement_value) as species
  from tbl_physical_samples ps
  join tbl_analysis_entities ae on ae.physical_sample_id = ps.physical_sample_id
  join tbl_dendro sp on sp.analysis_entity_id = ae.analysis_entity_id
  join tbl_dendro_lookup dl on dl.dendro_lookup_id = sp.dendro_lookup_id and dl.name = 'Tree species'
  group by ps.physical_sample_id
)
select fy.physical_sample_id, fy.best_year, species.species,
       s.site_id, s.site_name, s.latitude_dd, s.longitude_dd
from fy
join species on species.physical_sample_id = fy.physical_sample_id
join tbl_physical_samples ps on ps.physical_sample_id = fy.physical_sample_id
join tbl_sample_groups sg on sg.sample_group_id = ps.sample_group_id
join tbl_sites s on s.site_id = sg.site_id
where fy.best_year is not null and s.latitude_dd is not null
  and species.species not in ('Undefined')
"""


def main():
    engine = get_engine()
    df = query(engine, SAMPLES_SQL)
    print(f"{len(df)} geolocated, species-identified, dated timbers")

    df["bucket"] = (df["best_year"] // BUCKET_SIZE) * BUCKET_SIZE
    buckets = sorted(df["bucket"].unique())

    species_dir = os.path.join(WEB_DATA_DIR, "timber-species-map")
    os.makedirs(species_dir, exist_ok=True)

    bucket_index = []
    for bucket in buckets:
        bdf = df[df["bucket"] == bucket]
        points = [
            {
                "site_id": int(r.site_id),
                "site_name": r.site_name,
                "lat": float(r.latitude_dd),
                "lon": float(r.longitude_dd),
                "species": r.species,
                "year": int(r.best_year),
            }
            for r in bdf.itertuples()
        ]
        composition = (
            bdf["species"].value_counts(normalize=True).mul(100).round(1).to_dict()
        )
        entry = {
            "bucket_start": int(bucket),
            "label": f"{ad_label(bucket)} - {ad_label(bucket + BUCKET_SIZE)}",
            "n_samples": len(bdf),
            "composition": composition,
            "points": points,
        }
        bucket_index.append(entry)
        with open(os.path.join(species_dir, f"{int(bucket)}.json"), "w", encoding="utf-8") as f:
            json.dump(entry, f, ensure_ascii=False, indent=2)
        print(f"  {entry['label']}: {len(points)} samples, top species "
              f"{max(composition, key=composition.get) if composition else 'n/a'}")

    index = [
        {"bucket_start": b["bucket_start"], "label": b["label"], "n_samples": b["n_samples"]}
        for b in bucket_index
    ]
    with open(os.path.join(species_dir, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(bucket_index)} time buckets to {species_dir}")


if __name__ == "__main__":
    main()
