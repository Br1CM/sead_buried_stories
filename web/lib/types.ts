export interface ImageCredit {
  url: string;
  license: string | null;
  creator: string | null;
  source: string | null;
}

export interface SpeciesIndexEntry {
  taxon_id: number;
  scientific_name: string;
  common_name_en: string | null;
  common_name_local: string | null;
  n_sites: number;
  n_finds: number;
  image: ImageCredit | null;
  oldest_label: string | null;
  youngest_label: string | null;
}

export interface SpeciesPathStop {
  site_id: number;
  site_name: string;
  lat: number;
  lon: number;
  age_older_bp: number;
  age_younger_bp: number;
  label: string;
  n_finds: number;
}

export interface SpeciesDetail extends SpeciesIndexEntry {
  path: SpeciesPathStop[];
}

export interface CeramicsPeriodSummary {
  slug: string;
  name: string;
  label_range: string;
  avg_older_bp: number;
  avg_younger_bp: number | null;
  n_samples: number;
  n_sites: number;
}

export interface CeramicsSite {
  site_id: number;
  site_name: string;
  lat: number;
  lon: number;
  n_samples: number;
}

export interface TemperStat {
  material: string;
  pct_present: number | null;
  n_observed: number;
}

export interface CeramicsPeriodDetail extends CeramicsPeriodSummary {
  sites: CeramicsSite[];
  temper: TemperStat[];
}

export interface SiteIndexEntry {
  site_id: number;
  site_name: string;
  lat: number;
  lon: number;
  n_taxa: number;
  n_layers: number;
  oldest_label: string | null;
  youngest_label: string | null;
}

export interface SiteLayerTaxon {
  scientific_name: string;
  common_name_local: string | null;
  common_name_en: string | null;
  image: ImageCredit | null;
  total_abundance: number;
}

export interface SiteLayer {
  age_older_bp: number;
  age_younger_bp: number;
  label: string;
  n_taxa: number;
  taxa: SiteLayerTaxon[];
}

export interface SiteDetail extends SiteIndexEntry {
  layers: SiteLayer[];
}

export interface ClimatePoint {
  age_bp: number;
  label: string;
  reconstructed_tmax_c: number;
  range_low_c: number;
  range_high_c: number;
  n_samples: number;
}
