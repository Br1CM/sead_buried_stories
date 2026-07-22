"""Exports 'The Ancient Thermometer' story: a reconstructed temperature curve built
from the Mutual Climatic Range (MCR) method -- beetle species only survive within a
known temperature envelope today, so the mix of beetles found in a dated sample brackets
the temperature where they lived.

Simplification: this uses each taxon's MCR "center of gravity" max-temperature estimate
(cog_mid_tmax) averaged across taxa present in a sample, then averaged again across
samples falling in the same time bucket. That's a coarse public-facing proxy, not a
publication-grade MCR reconstruction (which intersects each taxon's full range rather
than averaging point estimates) -- good enough to show a real, data-driven warming/cooling
trend without requiring a client to run interval-intersection math.

Usage: venv\\Scripts\\python.exe export_climate.py
"""
import json
import os

from config import WEB_DATA_DIR
from dating import calendar_label
from db import get_engine, query

MAX_AGE_BP = 15000  # Holocene + Late Glacial; excludes rare Pleistocene outlier samples
BUCKET_SIZE = 250

SAMPLE_TAXA_SQL = """
select psd.physical_sample_id, psd.site_id, psd.site_name, psd.latitude_dd, psd.longitude_dd,
       psd.age_older, psd.age_younger,
       ab.taxon_id, mcr.cog_mid_tmax, mcr.tmax_lo, mcr.tmax_hi
from tbl_abundances ab
join tbl_analysis_entities ae on ae.analysis_entity_id = ab.analysis_entity_id
join tbl_mcr_summary_data mcr on mcr.taxon_id = ab.taxon_id
join sead_utility.physical_sample_dating psd on psd.physical_sample_id = ae.physical_sample_id
where psd.age_older is not null and psd.age_younger is not null and psd.latitude_dd is not null
  and psd.age_older between 0 and :max_age
  and mcr.cog_mid_tmax is not null
"""


def main():
    engine = get_engine()
    df = query(engine, SAMPLE_TAXA_SQL, {"max_age": MAX_AGE_BP})
    print(f"{len(df)} taxon-in-sample rows across {df['physical_sample_id'].nunique()} samples")

    per_sample = (
        df.groupby("physical_sample_id")
        .agg(
            avg_tmax=("cog_mid_tmax", "mean"),
            avg_tmax_lo=("tmax_lo", "mean"),
            avg_tmax_hi=("tmax_hi", "mean"),
            age_older=("age_older", "first"),
            age_younger=("age_younger", "first"),
            n_taxa=("taxon_id", "nunique"),
        )
        .reset_index()
    )
    per_sample["age_mid"] = (per_sample["age_older"] + per_sample["age_younger"]) / 2
    # A few reference/calibration samples are dated after 1950 (negative BP) -- not
    # meaningful for an "ancient" reconstruction, so they're dropped here.
    per_sample = per_sample[per_sample["age_mid"] >= 0]
    per_sample["bucket"] = (per_sample["age_mid"] // BUCKET_SIZE) * BUCKET_SIZE

    buckets = (
        per_sample.groupby("bucket")
        .agg(
            avg_tmax=("avg_tmax", "mean"),
            avg_tmax_lo=("avg_tmax_lo", "mean"),
            avg_tmax_hi=("avg_tmax_hi", "mean"),
            n_samples=("physical_sample_id", "nunique"),
        )
        .reset_index()
        .sort_values("bucket", ascending=False)
    )

    series = [
        {
            "age_bp": float(b.bucket),
            "label": calendar_label(b.bucket),
            "reconstructed_tmax_c": round(float(b.avg_tmax), 1),
            "range_low_c": round(float(b.avg_tmax_lo), 1),
            "range_high_c": round(float(b.avg_tmax_hi), 1),
            "n_samples": int(b.n_samples),
        }
        for b in buckets.itertuples()
    ]

    climate_dir = os.path.join(WEB_DATA_DIR, "climate")
    os.makedirs(climate_dir, exist_ok=True)
    with open(os.path.join(climate_dir, "series.json"), "w", encoding="utf-8") as f:
        json.dump(series, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(series)} time buckets to {climate_dir}")
    print(f"Range: {series[0]['label']} ({series[0]['reconstructed_tmax_c']} C) "
          f"-> {series[-1]['label']} ({series[-1]['reconstructed_tmax_c']} C)")


if __name__ == "__main__":
    main()
