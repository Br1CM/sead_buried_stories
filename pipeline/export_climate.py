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

Also exports a per-species breakdown for the "filter by species" picker: the same
bucket-level reconstruction, but restricted to samples where a given beetle species was
actually present. A species' own MCR value (cog_mid_tmax) is a fixed constant, not
something that varies over time, so a "thermometer" built from ONLY that species' value
would just be a flat line -- what actually produces a different, meaningful curve per
species is filtering WHICH SAMPLES feed the existing multi-species average, while still
averaging across every taxon co-occurring in each of those samples (same methodology as
the main curve, just over a different sample set). Curated to species with at least
MIN_BUCKETS of coverage and an existing web/public/data/species/{taxon_id}.json (reused
for the name/photo shown in the picker -- Species Path's curated taxa turn out to
overlap almost completely with the most MCR-attested beetles, so only a rare few
candidates get skipped for lacking a local name/photo).

Usage: venv\\Scripts\\python.exe export_climate.py
"""
import json
import os

from config import WEB_DATA_DIR
from dating import calendar_label
from db import get_engine, query

MAX_AGE_BP = 15000  # Holocene + Late Glacial; excludes rare Pleistocene outlier samples
BUCKET_SIZE = 250
MIN_BUCKETS = 15  # curation floor so every species option has a legible curve
MAX_SPECIES = 24  # keep the picker to a clean, curated set

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


def build_bucket_series(rows_df):
    """Aggregate a taxon-in-sample rows dataframe (any subset of the full one) into the
    bucket-level series shape used throughout the module: average across all taxa present
    in each sample, then average across samples falling in the same time bucket.
    """
    per_sample = (
        rows_df.groupby("physical_sample_id")
        .agg(
            avg_tmax=("cog_mid_tmax", "mean"),
            avg_tmax_lo=("tmax_lo", "mean"),
            avg_tmax_hi=("tmax_hi", "mean"),
            age_older=("age_older", "first"),
            age_younger=("age_younger", "first"),
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

    return [
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


def load_species_info(taxon_id: int, species_dir: str) -> dict | None:
    path = os.path.join(species_dir, f"{taxon_id}.json")
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        s = json.load(f)
    return {
        "taxon_id": taxon_id,
        "common_name_en": s.get("common_name_en"),
        "scientific_name": s.get("scientific_name"),
        "image": s.get("image"),
    }


def main():
    engine = get_engine()
    df = query(engine, SAMPLE_TAXA_SQL, {"max_age": MAX_AGE_BP})
    print(f"{len(df)} taxon-in-sample rows across {df['physical_sample_id'].nunique()} samples")

    series = build_bucket_series(df)

    climate_dir = os.path.join(WEB_DATA_DIR, "climate")
    os.makedirs(climate_dir, exist_ok=True)
    with open(os.path.join(climate_dir, "series.json"), "w", encoding="utf-8") as f:
        json.dump(series, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(series)} time buckets to {climate_dir}")
    print(f"Range: {series[0]['label']} ({series[0]['reconstructed_tmax_c']} C) "
          f"-> {series[-1]['label']} ({series[-1]['reconstructed_tmax_c']} C)")

    # Per-species breakdown for the filter picker.
    species_dir = os.path.join(WEB_DATA_DIR, "species")
    species_series_dir = os.path.join(climate_dir, "species")
    os.makedirs(species_series_dir, exist_ok=True)

    candidates = df.groupby("taxon_id")["physical_sample_id"].nunique().sort_values(ascending=False)
    species_index = []
    for taxon_id in candidates.index:
        if len(species_index) >= MAX_SPECIES:
            break
        info = load_species_info(int(taxon_id), species_dir)
        if info is None:
            continue  # no local name/photo to show in the picker -- skip rather than fetch
        subset = df[df["physical_sample_id"].isin(df.loc[df["taxon_id"] == taxon_id, "physical_sample_id"])]
        species_buckets = build_bucket_series(subset)
        if len(species_buckets) < MIN_BUCKETS:
            continue
        with open(os.path.join(species_series_dir, f"{taxon_id}.json"), "w", encoding="utf-8") as f:
            json.dump(species_buckets, f, ensure_ascii=False, indent=2)
        species_index.append({**info, "n_samples": int(candidates[taxon_id]), "n_buckets": len(species_buckets)})

    with open(os.path.join(climate_dir, "species-index.json"), "w", encoding="utf-8") as f:
        json.dump(species_index, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(species_index)} curated species breakdowns to {species_series_dir}")


if __name__ == "__main__":
    main()
