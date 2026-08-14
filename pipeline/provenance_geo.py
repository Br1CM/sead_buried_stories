"""Approximate centroid coordinates for the Swedish historical provinces (landskap) that
appear as dendrochronology "Provenance" values in sead_staging. SEAD stores provenance as
free-text region names, not coordinates, so there's nothing to join against -- these are
hand-picked approximate centroids for storytelling-map purposes only, not precise findspots.

Only covers the provinces that actually appear in the Sister Buildings clusters (see
export_timber_sisters.py); extend as needed if broader provenance coverage is required.
"""

PROVENANCE_CENTROIDS: dict[str, tuple[float, float]] = {
    "Småland": (57.0, 14.8),
    "Skåne": (55.8, 13.5),
    "Uppland": (59.9, 17.8),
    "Gotland": (57.4, 18.5),
    "Östergötland": (58.3, 15.5),
    "Östra Svealand": (59.3, 18.0),
    "Mälardalen/Stockholms skärgård": (59.3, 18.5),
}


def get_centroid(provenance: str) -> tuple[float, float] | None:
    return PROVENANCE_CENTROIDS.get(provenance)
