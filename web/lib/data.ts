import fs from "node:fs";
import path from "node:path";
import type {
  CeramicsPeriodDetail,
  CeramicsPeriodSummary,
  ClimatePoint,
  ClimateSpeciesIndexEntry,
  SiteDetail,
  SiteIndexEntry,
  SitePhoto,
  SpeciesDetail,
  SpeciesIndexEntry,
  TimberPreciseSample,
  TimberRingsDetail,
  TimberRingsIndexEntry,
  TimberSpeciesBucketDetail,
  TimberSpeciesBucketSummary,
  SisterCluster,
  ProvenanceShape,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "public", "data");

function dataPath(relativePath: string): string | null {
  const resolved = path.resolve(DATA_DIR, relativePath);
  const dataRoot = path.resolve(DATA_DIR);
  return resolved === dataRoot || resolved.startsWith(`${dataRoot}${path.sep}`) ? resolved : null;
}

function readJson<T>(relativePath: string): T | null {
  const filePath = dataPath(relativePath);
  if (!filePath) return null;
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

export function getSpeciesIndex(): SpeciesIndexEntry[] {
  return readJson<SpeciesIndexEntry[]>("species/index.json") ?? [];
}

export function getSpeciesDetail(taxonId: string): SpeciesDetail | null {
  return readJson<SpeciesDetail>(`species/${taxonId}.json`);
}

export function getCeramicsIndex(): CeramicsPeriodSummary[] {
  return readJson<CeramicsPeriodSummary[]>("ceramics/index.json") ?? [];
}

export function getCeramicsPeriod(slug: string): CeramicsPeriodDetail | null {
  return readJson<CeramicsPeriodDetail>(`ceramics/${slug}.json`);
}

export function getAllCeramicsPeriods(): CeramicsPeriodDetail[] {
  return getCeramicsIndex()
    .map((p) => getCeramicsPeriod(p.slug))
    .filter((p): p is CeramicsPeriodDetail => p !== null);
}

export function getClimateSeries(): ClimatePoint[] {
  return readJson<ClimatePoint[]>("climate/series.json") ?? [];
}

export function getClimateSpeciesIndex(): ClimateSpeciesIndexEntry[] {
  return readJson<ClimateSpeciesIndexEntry[]>("climate/species-index.json") ?? [];
}

export function getClimateSpeciesSeries(taxonId: number): ClimatePoint[] {
  return readJson<ClimatePoint[]>(`climate/species/${taxonId}.json`) ?? [];
}

export function getSitesIndex(): SiteIndexEntry[] {
  return readJson<SiteIndexEntry[]>("sites/index.json") ?? [];
}

export function getSiteDetail(siteId: string): SiteDetail | null {
  return readJson<SiteDetail>(`sites/${siteId}.json`);
}

export function getTimberPreciseSamples(): TimberPreciseSample[] {
  return readJson<TimberPreciseSample[]>("timber-precise/index.json") ?? [];
}

export function getTimberRingsIndex(): TimberRingsIndexEntry[] {
  return readJson<TimberRingsIndexEntry[]>("timber-rings/index.json") ?? [];
}

export function getTimberRingsDetail(siteId: string): TimberRingsDetail | null {
  return readJson<TimberRingsDetail>(`timber-rings/${siteId}.json`);
}

export function getTimberSpeciesMapIndex(): TimberSpeciesBucketSummary[] {
  return readJson<TimberSpeciesBucketSummary[]>("timber-species-map/index.json") ?? [];
}

export function getTimberSpeciesBucket(bucketStart: number): TimberSpeciesBucketDetail | null {
  return readJson<TimberSpeciesBucketDetail>(`timber-species-map/${bucketStart}.json`);
}

export function getAllTimberSpeciesBuckets(): TimberSpeciesBucketDetail[] {
  return getTimberSpeciesMapIndex()
    .map((b) => getTimberSpeciesBucket(b.bucket_start))
    .filter((b): b is TimberSpeciesBucketDetail => b !== null);
}

export function getSisterClusters(): SisterCluster[] {
  return readJson<SisterCluster[]>("timber-sisters/index.json") ?? [];
}

export function getProvenanceShapes(): Record<string, ProvenanceShape> {
  return readJson<Record<string, ProvenanceShape>>("timber-sisters/provenance-shapes.json") ?? {};
}

export function getClayChroniclesPhoto(): SitePhoto | null {
  return readJson<SitePhoto>("hubs/clay-chronicles.json");
}
