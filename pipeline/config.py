import os

from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "name": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
}

GBIF_MEDIA_URL = "https://api.gbif.org/v1/species/{key}/media"
WIKIPEDIA_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/{title}"

TAXON_VERIFICATION_GBIF_CSV = os.path.join(
    "..", "..", "sead_taxon_verification", "output", "full", "taxa_verification_full_gbif.csv"
)

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB_DATA_DIR = os.path.join(REPO_ROOT, "web", "public", "data")
WEB_IMAGES_DIR = os.path.join(REPO_ROOT, "web", "public", "images")
