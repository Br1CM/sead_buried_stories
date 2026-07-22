import { getSpeciesIndex } from "@/lib/data";
import { SpeciesPicker } from "@/components/SpeciesPicker";
import { SpeciesCountryHighlights } from "@/components/SpeciesCountryHighlights";

export const metadata = { title: "Species Path | Buried Stories" };

export default function SpeciesPage() {
  const species = getSpeciesIndex();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Species Path</h1>
      <p className="mt-2 max-w-2xl text-white/60">
        Every creature below was pulled from the ground somewhere in Europe, dated, and
        logged. Pick one and follow it across thousands of years, from the oldest site
        where it turned up to the most recent.
      </p>

      <SpeciesCountryHighlights species={species} />

      <div className="mt-8">
        <SpeciesPicker species={species} />
      </div>
    </div>
  );
}
