# Buried Stories

A public-facing web app that turns [SEAD](https://www.sead.se) — the Strategic
Environmental Archaeology Database — into playful, story-driven experiences for
people with no archaeology background. Instead of tables and filters, you pick a
thread (a species, a place, a period, a climate) and follow it through time.

## What's here

Four ways into the data, each its own page:

- **Species Path** — pick a creature and watch a map trace every dated site where
  it's been found, oldest to most recent. The 100 species shown are the most
  numerically-dated ones in the database (mostly beetles — SEAD's specialty is
  paleoentomology), plus a highlighted top 10 that turn up in the most different
  countries, likely stowaways of trade and travel rather than homebodies.
- **Ceramics Through Time** — step through named historical periods (Mesolithic
  through Post-Reformation) and see how potters' recipes for tempering clay
  changed — granite gives way to crushed pottery ("chamotte") by the Medieval
  period.
- **The Ancient Thermometer** — a reconstructed temperature curve built from
  beetle assemblages: each species only tolerates a narrow climate range today,
  so the mix of species found in a dated layer brackets how warm it was.
- **Dig One Spot** — pick a well-studied excavation (like York's famous
  Coppergate Viking-age site) and descend through its dated layers, meeting what
  was living there at each depth in time.

Every photo shown has an attribution line — images are pulled from GBIF and
Wikipedia at export time, not stored in SEAD itself.

---

## For developers

### How it fits together

```
sead_history/
  pipeline/   Python ETL — queries sead_staging once, writes static JSON
  web/        Next.js app — reads that JSON, never touches the live DB
```

The web app has **no live database connection**. A Python pipeline queries
`sead_staging` and writes the result as static JSON into `web/public/data/`,
which is committed to the repo and read directly off disk by the Next.js app
at build/request time. To publish new or updated data, re-run the relevant
export script and commit the changed JSON.

### Pipeline setup

```bash
cd pipeline
python -m venv venv
venv\Scripts\activate        # venv/bin/activate on macOS/Linux
pip install -r requirements.txt
cp .env.example .env          # fill in DB_HOST/PORT/NAME/USER/PASSWORD
```

Each module has its own export script:

| Script | Writes to | Notes |
|---|---|---|
| `export_species_paths.py` | `web/public/data/species/` | `--limit N` (default 100), `--skip-images` to skip GBIF calls |
| `export_ceramics.py` | `web/public/data/ceramics/` | `--limit N` periods (default 16) |
| `export_climate.py` | `web/public/data/climate/` | no args |
| `export_site_biography.py` | `web/public/data/sites/` | `--limit N` sites (default 20), `--skip-images` |

Run whichever you touched, e.g.:

```bash
venv\Scripts\python.exe export_species_paths.py
```

Shared helpers:
- `db.py` / `config.py` — SQLAlchemy connection + `.env` loading.
- `dating.py` — converts SEAD's years-BP convention to calendar-year labels.
- `gbif_media.py` — resolves a photo + English common name per taxon via the
  GBIF Species API (falling back to Wikipedia), using the GBIF match already
  computed by the sibling `sead_taxon_verification` project. Results are cached
  in `_cache_species_media.json` (shared across export scripts, gitignored-free
  so it's committed — delete it to force a refetch).

### Web app setup

```bash
cd web
npm install
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

Key structure:
- `app/` — one route per story (`species/`, `ceramics/`, `climate/`, `sites/`),
  App Router.
- `lib/data.ts` — reads the static JSON from `public/data/` off disk (server-side).
- `lib/types.ts` — shared TypeScript types matching the pipeline's JSON shape.
- `components/` — maps (`MapTrace`, `CeramicsMap`, `SitesMap`, `LocatorMap`, all
  MapLibre GL via `react-map-gl`), charts (`ClimateChart`, `TemperChart`), and
  pickers/timelines per module.

The basemap (`lib/basemap.ts`) uses raw OpenStreetMap raster tiles — no API key
needed, but fine only for light traffic per OSM's tile usage policy. Swap in a
MapTiler/Stadia vector style before this sees real public load.

### Adding a new story module

1. Write a pipeline script that queries `sead_staging` and writes JSON to a new
   `web/public/data/<module>/` folder (mirror the existing scripts' shape:
   an `index.json` list + one file per item).
2. Add matching types to `lib/types.ts` and a loader to `lib/data.ts`.
3. Build the page under `app/<module>/`, reusing existing map/chart/timeline
   components where the shape fits.

### Data quirks worth knowing before you query `sead_staging` directly

- Ages are years **BP** (Before Present, 1950 baseline) — `age_older` is
  further in the past than `age_younger`. See `dating.py`.
- There are two independent dating systems in SEAD: **chronometric**
  (numeric years, via `sead_utility.physical_sample_dating` /
  `tbl_analysis_entity_ages`) and **relative** (named periods, via
  `tbl_relative_ages`/`tbl_relative_dates`). In this snapshot they don't
  overlap — the crop plants with SEAD-native common names are dated only via
  relative periods, while the numerically-dated abundance data is almost
  entirely beetles. Species Path uses chronometric data; Ceramics Through Time
  uses relative periods.
- `tbl_taxa_images`, `tbl_site_images`, and friends are empty in staging — all
  imagery comes from GBIF/Wikipedia, not the database.
