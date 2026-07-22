"""Fetch representative images and English vernacular names for taxa, keyed off the
GBIF usageKey already resolved by the sibling sead_taxon_verification project.
"""
import json
import os
import re

import pandas as pd
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from config import GBIF_MEDIA_URL, TAXON_VERIFICATION_GBIF_CSV, WIKIPEDIA_SUMMARY_URL

GBIF_VERNACULAR_URL = "https://api.gbif.org/v1/species/{key}/vernacularNames"
GBIF_OCCURRENCE_SEARCH_URL = "https://api.gbif.org/v1/occurrence/search"

# Shared across every export script so a taxon fetched once (e.g. by Species Path) is
# never re-fetched from GBIF by another module (e.g. Dig One Spot) that references it.
MEDIA_CACHE_PATH = os.path.join(os.path.dirname(__file__), "_cache_species_media.json")

_session = requests.Session()
_retry = Retry(total=3, backoff_factor=0.5, status_forcelist=[429, 500, 502, 503, 504])
_session.mount("https://", HTTPAdapter(max_retries=_retry))

_CC_LICENSE_LABELS = {
    "publicdomain/zero": "CC0 (Public Domain)",
    "publicdomain/mark": "Public Domain",
    "by-nc-nd": "CC BY-NC-ND",
    "by-nc-sa": "CC BY-NC-SA",
    "by-nc": "CC BY-NC",
    "by-nd": "CC BY-ND",
    "by-sa": "CC BY-SA",
    "by": "CC BY",
}


def format_license(license_value: str | None) -> str | None:
    """Turn a raw Creative Commons URL (as GBIF returns it) into a short readable
    label, e.g. 'http://creativecommons.org/licenses/by-nc/4.0/' -> 'CC BY-NC 4.0'.
    Leaves anything that isn't a recognized CC URL untouched.
    """
    if not license_value:
        return license_value

    match = re.search(r"creativecommons\.org/(licenses|publicdomain)/([\w-]+)/?(\d+\.\d+)?", license_value)
    if not match:
        return license_value

    kind, slug, version = match.group(1), match.group(2), match.group(3)
    if kind == "publicdomain":
        return _CC_LICENSE_LABELS.get(f"publicdomain/{slug}", license_value)

    label = _CC_LICENSE_LABELS.get(slug)
    if not label:
        return license_value
    return f"{label} {version}" if version else label


def load_media_cache() -> dict:
    if os.path.exists(MEDIA_CACHE_PATH):
        with open(MEDIA_CACHE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_media_cache(cache: dict) -> None:
    with open(MEDIA_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


def load_gbif_keys() -> dict:
    """taxon_id -> gbif usageKey, parsed from the verification project's gbif_url column."""
    path = os.path.join(os.path.dirname(__file__), TAXON_VERIFICATION_GBIF_CSV)
    df = pd.read_csv(path)
    keys = {}
    for taxon_id, url in zip(df["taxon_id"], df["gbif_url"]):
        if pd.isna(url):
            continue
        match = re.search(r"/species/(\d+)", str(url))
        if match:
            keys[int(taxon_id)] = int(match.group(1))
    return keys


def fetch_image(gbif_key: int) -> dict | None:
    try:
        resp = _session.get(GBIF_MEDIA_URL.format(key=gbif_key), timeout=10)
        resp.raise_for_status()
        results = resp.json().get("results", [])
    except requests.RequestException:
        return None

    for item in results:
        url = item.get("identifier")
        if not url or item.get("type") != "StillImage":
            continue
        return {
            "url": url,
            "license": format_license(item.get("license")),
            "creator": item.get("creator") or item.get("rightsHolder"),
            "source": item.get("publisher") or item.get("source") or "GBIF",
        }
    return None


def fetch_occurrence_image(gbif_key: int) -> dict | None:
    """Fall back to GBIF occurrence records (mostly iNaturalist observations) when the
    curated species-level media endpoint has nothing -- much broader coverage, since
    almost every occurrence-linked photo on GBIF lives here, not on the species page.
    """
    try:
        resp = _session.get(
            GBIF_OCCURRENCE_SEARCH_URL,
            params={"taxonKey": gbif_key, "mediaType": "StillImage", "limit": 20},
            timeout=10,
        )
        resp.raise_for_status()
        results = resp.json().get("results", [])
    except requests.RequestException:
        return None

    for occ in results:
        for item in occ.get("media", []):
            url = item.get("identifier")
            if not url or item.get("type") != "StillImage":
                continue
            return {
                "url": url,
                "license": format_license(item.get("license")),
                "creator": item.get("creator") or item.get("rightsHolder"),
                "source": item.get("publisher") or "GBIF",
            }
    return None


def fetch_vernacular_en(gbif_key: int) -> str | None:
    try:
        resp = _session.get(GBIF_VERNACULAR_URL.format(key=gbif_key), timeout=10)
        resp.raise_for_status()
        results = resp.json().get("results", [])
    except requests.RequestException:
        return None

    for item in results:
        if item.get("language") == "eng":
            return item.get("vernacularName")
    return None


def fetch_wikipedia_image(scientific_name: str) -> dict | None:
    try:
        resp = _session.get(
            WIKIPEDIA_SUMMARY_URL.format(title=scientific_name.replace(" ", "_")),
            timeout=10,
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
    except requests.RequestException:
        return None

    thumb = data.get("thumbnail", {}).get("source") or data.get("originalimage", {}).get("source")
    if not thumb:
        return None
    return {
        "url": thumb,
        "license": "Wikipedia (see article for image credit)",
        "creator": None,
        "source": "Wikipedia",
    }


def resolve_species_media(taxon_id: int, scientific_name: str, gbif_keys: dict) -> dict:
    """Best-effort image + English common name for one taxon. Never raises."""
    gbif_key = gbif_keys.get(taxon_id)
    image = None
    common_name_en = None

    if gbif_key:
        image = fetch_image(gbif_key)
        if image is None:
            image = fetch_occurrence_image(gbif_key)
        common_name_en = fetch_vernacular_en(gbif_key)

    if image is None:
        image = fetch_wikipedia_image(scientific_name)

    return {"image": image, "common_name_en": common_name_en}
