// Fixed categorical colors for tree species, shared across TimberRings, the species
// composition chart, and the species map -- same entity, same color, everywhere.
// Only the three numerically meaningful species (Tall/Pine 3074 samples, Ek/Oak 1451,
// Gran/Spruce 219 in sead_staging) get a dedicated hue; everything else folds into
// "Other" rather than generating a 4th+ hue for a handful of samples (dataviz skill:
// categorical hues are fixed and never cycled/generated). Hues are dark-mode steps
// from the skill's validated 8-hue categorical palette (slots 1-3, which clear the
// all-pairs CVD/contrast floors together -- needed here since TimberSpeciesMap shows
// many overlapping points, the dense "all-pairs" case).
export const SPECIES_COLORS: Record<string, string> = {
  Tall: "#3987e5", // slot 1 blue
  Ek: "#d95926", // slot 2 orange
  Gran: "#199e70", // slot 3 aqua
};

export const SPECIES_OTHER_COLOR = "#898781"; // muted ink, for every other species

export const SPECIES_EN: Record<string, string> = {
  Tall: "Pine",
  Ek: "Oak",
  Gran: "Spruce",
  Ask: "Ash",
  Bok: "Beech",
  Björk: "Birch",
  Lind: "Linden",
  Lärk: "Larch",
};

export function speciesColor(speciesLocal: string | null | undefined): string {
  if (!speciesLocal) return SPECIES_OTHER_COLOR;
  return SPECIES_COLORS[speciesLocal] ?? SPECIES_OTHER_COLOR;
}

export function speciesLabel(speciesLocal: string | null | undefined): string {
  if (!speciesLocal) return "Unknown";
  return SPECIES_EN[speciesLocal] ?? speciesLocal;
}
