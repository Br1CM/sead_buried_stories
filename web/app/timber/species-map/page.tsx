import { getAllTimberSpeciesBuckets } from "@/lib/data";
import { TimberSpeciesExplorer } from "@/components/TimberSpeciesExplorer";
import { DatingNote } from "@/components/DatingNote";

export const metadata = { title: "What Sweden Was Built From | Buried Stories" };

export default function TimberSpeciesMapPage() {
  const buckets = getAllTimberSpeciesBuckets();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">What Sweden Was Built From</h1>
      <p className="mt-2 max-w-2xl text-ink-60">
        Every dated, species-identified timber SEAD has, plotted where it was found and
        scrubbed through 50-year windows. Watch oak give way to pine from the 1500s onward. <br />
        <span className="font-semibold">Important disclaimer:</span> This reflects which buildings happened to get dendro-dated, not a full survey
        of Swedish forests, but the shift is real and visible either way.
      </p>
      <DatingNote kind="dendro" />
      <div className="mt-8">
        <TimberSpeciesExplorer buckets={buckets} />
      </div>
    </div>
  );
}
