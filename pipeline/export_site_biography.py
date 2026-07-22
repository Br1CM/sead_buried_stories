"""Exports the 'Dig One Spot' story: pick one well-studied site and descend through its
dated layers, meeting the plants and insects found at each depth in time.

Usage: venv\\Scripts\\python.exe export_site_biography.py [--limit N]
"""
import argparse
import json
import os
import time

from config import WEB_DATA_DIR
from dating import calendar_label
from db import get_engine, query
from gbif_media import load_gbif_keys, load_media_cache, resolve_species_media, save_media_cache
from place_photos import get_cached_site_photo, load_photo_cache, save_photo_cache

SITE_CANDIDATES_SQL = """
select psd.site_id, psd.site_name, count(distinct ab.taxon_id) as n_taxa,
       count(distinct (psd.age_older, psd.age_younger)) as n_layers
from tbl_abundances ab
join tbl_analysis_entities ae on ae.analysis_entity_id = ab.analysis_entity_id
join sead_utility.physical_sample_dating psd on psd.physical_sample_id = ae.physical_sample_id
where psd.age_older is not null and psd.age_younger is not null and psd.latitude_dd is not null
  and psd.age_older < 20000
group by psd.site_id, psd.site_name
having count(distinct (psd.age_older, psd.age_younger)) >= 2
order by n_taxa desc
"""

SITE_META_SQL = """
select site_id, site_name, latitude_dd, longitude_dd
from tbl_sites where site_id = :site_id
"""

SITE_LAYERS_SQL = """
select psd.age_older, psd.age_younger, tg.genus_name, tm.species, cn.common_name,
       tm.taxon_id, sum(ab.abundance) as total_abundance, count(*) as n_finds
from tbl_abundances ab
join tbl_analysis_entities ae on ae.analysis_entity_id = ab.analysis_entity_id
join sead_utility.physical_sample_dating psd on psd.physical_sample_id = ae.physical_sample_id
join tbl_taxa_tree_master tm on tm.taxon_id = ab.taxon_id
join tbl_taxa_tree_genera tg on tg.genus_id = tm.genus_id
left join tbl_taxa_common_names cn on cn.taxon_id = tm.taxon_id
where psd.site_id = :site_id and psd.age_older is not null and psd.age_younger is not null
group by psd.age_older, psd.age_younger, tg.genus_name, tm.species, cn.common_name, tm.taxon_id
"""

TAXA_PER_LAYER = 10


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--skip-images", action="store_true")
    args = parser.parse_args()

    engine = get_engine()
    candidates = query(engine, SITE_CANDIDATES_SQL).head(args.limit)
    print(f"Curated {len(candidates)} sites")

    gbif_keys = load_gbif_keys() if not args.skip_images else {}
    media_cache = load_media_cache()
    photo_cache = load_photo_cache()

    def get_media(taxon_id: int, scientific_name: str) -> dict:
        if args.skip_images:
            return {"image": None, "common_name_en": None}
        cache_key = str(taxon_id)
        if cache_key in media_cache:
            return media_cache[cache_key]
        media = resolve_species_media(taxon_id, scientific_name, gbif_keys)
        media_cache[cache_key] = media
        save_media_cache(media_cache)
        time.sleep(0.2)
        return media

    sites_dir = os.path.join(WEB_DATA_DIR, "sites")
    os.makedirs(sites_dir, exist_ok=True)

    index = []
    for row in candidates.itertuples():
        meta = query(engine, SITE_META_SQL, {"site_id": int(row.site_id)}).iloc[0]
        layers_df = query(engine, SITE_LAYERS_SQL, {"site_id": int(row.site_id)})

        layers = []
        for (age_older, age_younger), group in layers_df.groupby(["age_older", "age_younger"]):
            top_taxa = group.sort_values("total_abundance", ascending=False).head(TAXA_PER_LAYER)
            taxa = []
            for t in top_taxa.itertuples():
                scientific_name = f"{t.genus_name} {t.species}"
                media = get_media(t.taxon_id, scientific_name)
                taxa.append(
                    {
                        "scientific_name": scientific_name,
                        "common_name_local": t.common_name if isinstance(t.common_name, str) else None,
                        "common_name_en": media.get("common_name_en"),
                        "image": media.get("image"),
                        "total_abundance": int(t.total_abundance) if t.total_abundance == t.total_abundance else 0,
                    }
                )
            layers.append(
                {
                    "age_older_bp": float(age_older),
                    "age_younger_bp": float(age_younger),
                    "label": f"{calendar_label(age_older)} - {calendar_label(age_younger)}",
                    "n_taxa": int(group["taxon_id"].nunique()),
                    "taxa": taxa,
                }
            )
        layers.sort(key=lambda l: l["age_older_bp"], reverse=True)

        site_photo = None if args.skip_images else get_cached_site_photo(row.site_name, photo_cache)
        save_photo_cache(photo_cache)

        entry = {
            "site_id": int(row.site_id),
            "site_name": row.site_name,
            "lat": float(meta.latitude_dd),
            "lon": float(meta.longitude_dd),
            "n_taxa": int(row.n_taxa),
            "n_layers": len(layers),
            "photo": site_photo,
            "oldest_label": layers[0]["label"] if layers else None,
            "youngest_label": layers[-1]["label"] if layers else None,
        }
        index.append(entry)

        with open(os.path.join(sites_dir, f"{row.site_id}.json"), "w", encoding="utf-8") as f:
            json.dump({**entry, "layers": layers}, f, ensure_ascii=False, indent=2)

        photo_note = f"photo of {site_photo['depicts']}" if site_photo else "no photo"
        print(f"  {row.site_name}: {len(layers)} layers, {row.n_taxa} taxa, {photo_note}")

    with open(os.path.join(sites_dir, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(index)} sites to {sites_dir}")


if __name__ == "__main__":
    main()
