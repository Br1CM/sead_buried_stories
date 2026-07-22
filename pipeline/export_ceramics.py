"""Exports the 'Ceramics Through Time' story: for each named historical period, the sites
where pottery was analysed and how common each tempering material was.

Usage: venv\\Scripts\\python.exe export_ceramics.py [--limit N]
"""
import argparse
import json
import os
import re

from config import WEB_DATA_DIR
from dating import calendar_label
from db import get_engine, query

PERIOD_CANDIDATES_SQL = """
with base as (
  select c.analysis_entity_id as ceramic_ae, ra.relative_age_name,
         ra.cal_age_older, ra.cal_age_younger, s.site_id
  from tbl_ceramics c
  join tbl_analysis_entities ae on ae.analysis_entity_id = c.analysis_entity_id
  join tbl_analysis_entities ae2 on ae2.physical_sample_id = ae.physical_sample_id
  join tbl_relative_dates rd on rd.analysis_entity_id = ae2.analysis_entity_id
  join tbl_relative_ages ra on ra.relative_age_id = rd.relative_age_id
  join tbl_physical_samples ps on ps.physical_sample_id = ae.physical_sample_id
  join tbl_sample_groups sg on sg.sample_group_id = ps.sample_group_id
  join tbl_sites s on s.site_id = sg.site_id
  where s.latitude_dd is not null
    and ra.relative_age_name not ilike 'quaternary%%'
)
select relative_age_name, avg(cal_age_older) as avg_older, avg(cal_age_younger) as avg_younger,
       count(distinct ceramic_ae) as n_samples, count(distinct site_id) as n_sites
from base
group by relative_age_name
order by n_samples desc
"""

PERIOD_SITES_SQL = """
select s.site_id, s.site_name, s.latitude_dd, s.longitude_dd,
       count(distinct c.analysis_entity_id) as n_samples
from tbl_ceramics c
join tbl_analysis_entities ae on ae.analysis_entity_id = c.analysis_entity_id
join tbl_analysis_entities ae2 on ae2.physical_sample_id = ae.physical_sample_id
join tbl_relative_dates rd on rd.analysis_entity_id = ae2.analysis_entity_id
join tbl_relative_ages ra on ra.relative_age_id = rd.relative_age_id
join tbl_physical_samples ps on ps.physical_sample_id = ae.physical_sample_id
join tbl_sample_groups sg on sg.sample_group_id = ps.sample_group_id
join tbl_sites s on s.site_id = sg.site_id
where ra.relative_age_name = :period and s.latitude_dd is not null
group by s.site_id, s.site_name, s.latitude_dd, s.longitude_dd
"""

PERIOD_TEMPER_SQL = """
select cl.name as lookup_name, c.measurement_value, count(*) as n
from tbl_ceramics c
join tbl_ceramics_lookup cl on cl.ceramics_lookup_id = c.ceramics_lookup_id
join tbl_analysis_entities ae on ae.analysis_entity_id = c.analysis_entity_id
join tbl_analysis_entities ae2 on ae2.physical_sample_id = ae.physical_sample_id
join tbl_relative_dates rd on rd.analysis_entity_id = ae2.analysis_entity_id
join tbl_relative_ages ra on ra.relative_age_id = rd.relative_age_id
where ra.relative_age_name = :period and cl.name like 'Tempering:%%'
group by cl.name, c.measurement_value
"""

TEMPER_LABELS = {
    "Tempering: Bone": "Bone",
    "Tempering: Sand": "Sand",
    "Tempering: Organic": "Organic material",
    "Tempering: Rock": "Crushed rock",
    "Tempering: Granite": "Granite",
    "Tempering: Asbestos": "Asbestos",
    "Tempering: Chamotte": "Chamotte (crushed pottery)",
    "Tempering: Calcarbon": "Shell/carbonate",
    "Tempering: Natural": "Naturally tempered clay",
    "Tempering: Accessory": "Other additive",
}


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=16)
    args = parser.parse_args()

    engine = get_engine()
    candidates = query(engine, PERIOD_CANDIDATES_SQL)
    candidates = candidates[candidates["avg_older"].notna()]
    top = candidates.head(args.limit).copy()
    top = top.sort_values("avg_older", ascending=False)

    ceramics_dir = os.path.join(WEB_DATA_DIR, "ceramics")
    os.makedirs(ceramics_dir, exist_ok=True)

    period_index = []
    for row in top.itertuples():
        slug = slugify(row.relative_age_name)
        label_range = f"{calendar_label(row.avg_older)} - {calendar_label(row.avg_younger)}"

        sites_df = query(engine, PERIOD_SITES_SQL, {"period": row.relative_age_name})
        sites = [
            {
                "site_id": int(s.site_id),
                "site_name": s.site_name,
                "lat": float(s.latitude_dd),
                "lon": float(s.longitude_dd),
                "n_samples": int(s.n_samples),
            }
            for s in sites_df.itertuples()
        ]

        temper_df = query(engine, PERIOD_TEMPER_SQL, {"period": row.relative_age_name})
        temper_df = temper_df[temper_df["lookup_name"].isin(TEMPER_LABELS)]
        temper = []
        for lookup_name, group in temper_df.groupby("lookup_name"):
            total = int(group["n"].sum())
            present = int(
                group.loc[~group["measurement_value"].str.strip().str.lower().eq("nej"), "n"].sum()
            )
            temper.append(
                {
                    "material": TEMPER_LABELS.get(lookup_name, lookup_name),
                    "pct_present": round(100 * present / total, 1) if total else None,
                    "n_observed": total,
                }
            )
        temper.sort(key=lambda t: t["pct_present"] or 0, reverse=True)

        entry = {
            "slug": slug,
            "name": row.relative_age_name.strip(),
            "label_range": label_range,
            "avg_older_bp": float(row.avg_older),
            "avg_younger_bp": float(row.avg_younger) if row.avg_younger == row.avg_younger else None,
            "n_samples": int(row.n_samples),
            "n_sites": int(row.n_sites),
        }
        period_index.append(entry)

        with open(os.path.join(ceramics_dir, f"{slug}.json"), "w", encoding="utf-8") as f:
            json.dump({**entry, "sites": sites, "temper": temper}, f, ensure_ascii=False, indent=2)

        print(f"  {row.relative_age_name} ({label_range}): {len(sites)} sites, "
              f"top temper={temper[0]['material'] if temper else 'n/a'}")

    with open(os.path.join(ceramics_dir, "index.json"), "w", encoding="utf-8") as f:
        json.dump(period_index, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(period_index)} periods to {ceramics_dir}")


if __name__ == "__main__":
    main()
