"""Exports 'The Exact Month a Tree Fell': a curated spotlight of dendrochronology samples
precise enough to name not just a felling YEAR but a MONTH -- possible only when the
outermost ring still has its bark ("waney edge") attached, meaning nothing was lost to
trimming/decay and the very last ring the tree ever grew is the one being read.

Usage: venv\\Scripts\\python.exe export_timber_precise.py [--limit N] [--skip-images]
"""
import argparse
import json
import os

from config import WEB_DATA_DIR
from dating import ad_label
from db import get_engine, query
from place_photos import get_cached_site_photo, load_photo_cache, save_photo_cache

PRECISE_SQL = """
select s.site_id, s.site_name, s.latitude_dd, s.longitude_dd,
       ae1.physical_sample_id, fy.age_older as felling_year, se.season_name
from tbl_dendro_dates fy
join tbl_dendro_lookup dlf on dlf.dendro_lookup_id = fy.dendro_lookup_id and dlf.name = 'Estimated felling year'
join tbl_seasons se on se.season_id = fy.season_id
join tbl_analysis_entities ae2 on ae2.analysis_entity_id = fy.analysis_entity_id
join tbl_analysis_entities ae1 on ae1.physical_sample_id = ae2.physical_sample_id
join tbl_dendro w on w.analysis_entity_id = ae1.analysis_entity_id
join tbl_dendro_lookup dlw on dlw.dendro_lookup_id = w.dendro_lookup_id and dlw.name = 'Waney edge (W)'
join tbl_physical_samples ps on ps.physical_sample_id = ae1.physical_sample_id
join tbl_sample_groups sg on sg.sample_group_id = ps.sample_group_id
join tbl_sites s on s.site_id = sg.site_id
where w.measurement_value = 'W' and s.latitude_dd is not null
  and se.season_name in ('January','February','March','April','May','June',
                          'July','August','September','October','November','December')
"""

SPECIES_SQL = """
select ps.physical_sample_id, sp.measurement_value as species
from tbl_physical_samples ps
join tbl_analysis_entities ae on ae.physical_sample_id = ps.physical_sample_id
join tbl_dendro sp on sp.analysis_entity_id = ae.analysis_entity_id
join tbl_dendro_lookup dl on dl.dendro_lookup_id = sp.dendro_lookup_id and dl.name = 'Tree species'
where ps.physical_sample_id = any(:sample_ids)
"""

SPECIES_LABELS = {
    "Tall": "Pine", "Ek": "Oak", "Gran": "Spruce", "Ask": "Ash",
    "Bok": "Beech", "Björk": "Birch", "Lind": "Linden", "Lärk": "Larch",
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=60)
    parser.add_argument("--skip-images", action="store_true")
    args = parser.parse_args()

    engine = get_engine()
    df = query(engine, PRECISE_SQL).drop_duplicates(subset="physical_sample_id")
    print(f"{len(df)} season-precise samples across {df['site_id'].nunique()} sites")

    species_df = query(engine, SPECIES_SQL, {"sample_ids": df["physical_sample_id"].tolist()})
    species_map = dict(zip(species_df["physical_sample_id"], species_df["species"]))
    df["species"] = df["physical_sample_id"].map(species_map)

    # Curate for variety: at most 3 per site, spread across the full time range, capped at --limit
    df = df.sort_values("felling_year")
    df["site_rank"] = df.groupby("site_id").cumcount()
    curated = df[df["site_rank"] < 3].copy()
    if len(curated) > args.limit:
        step = len(curated) / args.limit
        curated = curated.iloc[[int(i * step) for i in range(args.limit)]]

    photo_cache = load_photo_cache()
    timber_dir = os.path.join(WEB_DATA_DIR, "timber-precise")
    os.makedirs(timber_dir, exist_ok=True)

    samples = []
    for row in curated.itertuples():
        photo = (
            None
            if args.skip_images
            else get_cached_site_photo(row.site_name, photo_cache, langs=("sv", "en"))
        )
        species_local = row.species if isinstance(row.species, str) else None
        samples.append(
            {
                "site_id": int(row.site_id),
                "site_name": row.site_name,
                "lat": float(row.latitude_dd),
                "lon": float(row.longitude_dd),
                "species_local": species_local,
                "species_en": SPECIES_LABELS.get(species_local),
                "felling_year": int(row.felling_year),
                "label": ad_label(row.felling_year),
                "season_name": row.season_name,
                "photo": photo,
            }
        )
        print(f"  {row.site_name}: {row.season_name} {row.felling_year} ({species_local or '?'}), "
              f"photo={'yes' if photo else 'no'}")

    if not args.skip_images:
        save_photo_cache(photo_cache)

    with open(os.path.join(timber_dir, "index.json"), "w", encoding="utf-8") as f:
        json.dump(samples, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(samples)} curated samples to {timber_dir}")


if __name__ == "__main__":
    main()
