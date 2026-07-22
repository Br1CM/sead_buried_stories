import fs from "node:fs";
import path from "node:path";
import type {
  CeramicsPeriodDetail,
  CeramicsPeriodSummary,
  ClimatePoint,
  SiteDetail,
  SiteIndexEntry,
  SpeciesDetail,
  SpeciesIndexEntry,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "public", "data");

function readJson<T>(relativePath: string): T | null {
  const filePath = path.join(DATA_DIR, relativePath);
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

export function getSitesIndex(): SiteIndexEntry[] {
  return readJson<SiteIndexEntry[]>("sites/index.json") ?? [];
}

export function getSiteDetail(siteId: string): SiteDetail | null {
  return readJson<SiteDetail>(`sites/${siteId}.json`);
}
