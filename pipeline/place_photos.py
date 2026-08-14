"""Best-effort photo of the place a site is in, for Dig One Spot's "what does this
spot look like" header. SEAD has no site photos (tbl_site_images is empty in
staging), so this looks up a real-world photo of the named place via Wikipedia,
with proper Wikimedia Commons attribution.

Most SEAD site names are excavation-project names, not standalone Wikipedia
subjects (e.g. "York: 16-22 Coppergate"), so several simplified candidate titles
are tried per site -- the resulting photo shows the modern place/area, not the
literal excavation trench (which for most of these historical digs no longer
exists to photograph), so callers should caption it accordingly.
"""
import html
import json
import os
import re
from urllib.parse import unquote

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

WIKIPEDIA_API_URL = "https://{lang}.wikipedia.org/w/api.php"
COMMONS_API_URL = "https://commons.wikimedia.org/w/api.php"

PHOTO_CACHE_PATH = os.path.join(os.path.dirname(__file__), "_cache_site_photos.json")

# Wikipedia/Commons ask non-browser clients to identify themselves; requests without
# a descriptive User-Agent get blocked (a non-JSON error page) rather than a 4xx.
HEADERS = {"User-Agent": "BuriedStoriesBot/1.0 (educational archaeology storytelling project)"}

_session = requests.Session()
_retry = Retry(total=3, backoff_factor=0.5, status_forcelist=[429, 500, 502, 503, 504])
_session.mount("https://", HTTPAdapter(max_retries=_retry))


def _strip_html(value: str | None) -> str | None:
    if not value:
        return None
    text = html.unescape(re.sub(r"<[^>]+>", "", value)).strip()
    if not text:
        return None
    # Some Commons file pages transclude a Creator/Artist template whose
    # parameter was never filled in, leaving a literal unresolved placeholder
    # like "{{{artist}}}" in the extmetadata instead of a real name.
    if re.fullmatch(r"\{\{\{[^{}]*\}\}\}", text):
        return None
    return text


def candidate_titles(site_name: str) -> list[str]:
    """Generate progressively more general place names to try against Wikipedia,
    from the full excavation name down to the town/street it's actually in.
    Ordered most-specific-first so a real match on the exact spot (e.g. the street
    "Coppergate") wins over a coarser fallback (e.g. the city "York").
    """
    candidates = []

    def add(name: str | None):
        if name and name.strip():
            candidates.append(name.strip())

    add(site_name)

    before = None
    if ":" in site_name:
        before, after = (p.strip() for p in site_name.split(":", 1))
        add(re.sub(r"^[\d\-–,\s]+", "", after))  # e.g. "16-22 Coppergate" -> "Coppergate"
        add(after)

    paren = re.search(r"\(([^)]+)\)", site_name)
    if paren:
        add(paren.group(1))
        add(re.sub(r"\s*\([^)]+\)", "", site_name))

    if before:
        add(before)  # the general town/city, as a coarser fallback

    # Trailing qualifier stripped -- digits ("Runnymede 1") or short codes ("Runnymede LBA")
    for c in list(candidates):
        add(re.sub(r"\s+[\w./]{1,6}$", "", c))

    seen = set()
    ordered = []
    for c in candidates:
        if c.lower() not in seen:
            seen.add(c.lower())
            ordered.append(c)
    return ordered


def fetch_wikipedia_original_image(title: str, lang: str = "en") -> tuple[str, str] | None:
    """Returns (image_url, matched_page_title) for a non-disambiguation page with
    an original image, or None.
    """
    try:
        resp = _session.get(
            WIKIPEDIA_API_URL.format(lang=lang),
            params={
                "action": "query",
                "titles": title,
                "prop": "pageimages|pageprops",
                "piprop": "original",
                "redirects": 1,
                "format": "json",
            },
            headers=HEADERS,
            timeout=10,
        )
        resp.raise_for_status()
        pages = resp.json().get("query", {}).get("pages", {})
    except (requests.RequestException, ValueError):
        return None

    for page in pages.values():
        if "missing" in page or "disambiguation" in page.get("pageprops", {}):
            continue
        original = page.get("original", {}).get("source")
        if original:
            return original, page.get("title", title)
    return None


def fetch_commons_credit(image_url: str) -> dict:
    """Best-effort license/creator for a Wikimedia-hosted image URL. Falls back to
    a generic Wikipedia credit if the file page can't be resolved.
    """
    filename = unquote(image_url.split("?")[0].rsplit("/", 1)[-1])
    try:
        resp = _session.get(
            COMMONS_API_URL,
            params={
                "action": "query",
                "titles": f"File:{filename}",
                "prop": "imageinfo",
                "iiprop": "extmetadata",
                "format": "json",
            },
            headers=HEADERS,
            timeout=10,
        )
        resp.raise_for_status()
        pages = resp.json().get("query", {}).get("pages", {})
        page = next(iter(pages.values()))
        meta = page["imageinfo"][0]["extmetadata"]
    except (requests.RequestException, ValueError, KeyError, IndexError, StopIteration):
        return {"license": "See Wikimedia Commons", "creator": None, "source": "Wikimedia Commons"}

    return {
        "license": _strip_html(meta.get("LicenseShortName", {}).get("value")) or "See Wikimedia Commons",
        "creator": _strip_html(meta.get("Artist", {}).get("value")),
        "source": "Wikimedia Commons",
    }


def get_site_photo(site_name: str, langs: tuple[str, ...] = ("en",)) -> dict | None:
    """Best-effort real-world photo of the place a SEAD site is in. Returns
    {url, license, creator, source, depicts} where `depicts` is the actual matched
    place name (may be more general than the excavation name itself), or None.

    `langs` controls which Wikipedia language edition(s) to search, tried in order,
    each exhausted across all candidate titles before moving to the next language --
    e.g. langs=("sv", "en") for Swedish buildings, since a small parish church is far
    more likely to have a Swedish Wikipedia article than an English one.
    """
    for lang in langs:
        for title in candidate_titles(site_name):
            found = fetch_wikipedia_original_image(title, lang=lang)
            if not found:
                continue
            image_url, matched_title = found
            credit = fetch_commons_credit(image_url)
            return {"url": image_url, "depicts": matched_title, **credit}
    return None


def load_photo_cache() -> dict:
    if os.path.exists(PHOTO_CACHE_PATH):
        with open(PHOTO_CACHE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_photo_cache(cache: dict) -> None:
    with open(PHOTO_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


def get_cached_site_photo(
    site_name: str, cache: dict, langs: tuple[str, ...] = ("en",)
) -> dict | None:
    """Same as get_site_photo, but memoized in `cache` (keyed by site_name) so
    re-running the export doesn't re-hit Wikipedia/Commons for sites already resolved.
    """
    if site_name in cache:
        return cache[site_name]
    photo = get_site_photo(site_name, langs=langs)
    cache[site_name] = photo
    return photo
