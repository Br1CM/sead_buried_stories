"""One-off fetch of a representative photo for the "Clay Chronicles" homepage hub
card. Unlike Species Path/Dig One Spot/Timber Tales, SEAD's ceramics data has no
taxon or site tied to a single photogenic subject, so this pulls one real,
credited Wikimedia Commons photo of a decorated prehistoric pottery vessel via
the same Wikipedia lookup used in place_photos.py.

Six-Legged Sagas and Timber Tales don't need an equivalent script: their homepage
hero photos are picked directly from existing species/timber-rings data at
render time (see web/app/page.tsx).
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from place_photos import get_site_photo  # noqa: E402

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "web", "public", "data", "hubs")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "clay-chronicles.json")

# A real, well-photographed decorated Neolithic pottery vessel -- thematically on
# the nose for a temper/clay-composition storytelling module, and confirmed by
# hand to be a genuine object photo (not a distribution map).
SUBJECT = "Peterborough Ware"


def main():
    photo = get_site_photo(SUBJECT, langs=("en",))
    if not photo:
        raise SystemExit(f"No photo found for {SUBJECT!r}")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(photo, f, ensure_ascii=False, indent=2)
    print(f"Wrote {OUTPUT_PATH}: {photo['url']}")


if __name__ == "__main__":
    main()
