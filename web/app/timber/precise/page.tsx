import { getTimberPreciseSamples } from "@/lib/data";
import { TimberSpotlightCard } from "@/components/TimberSpotlightCard";
import { DatingNote } from "@/components/DatingNote";

export const metadata = { title: "The Exact Month a Tree Fell | Buried Stories" };

export default function TimberPrecisePage() {
  const samples = getTimberPreciseSamples();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">The Exact Month a Tree Fell</h1>
      <p className="mt-2 max-w-2xl text-ink-60">
        Most dates in archaeology come with centuries of uncertainty. These don&rsquo;t. When a
        felled tree still has its bark attached, the outermost ring is unmistakably its very
        last, making it precise enough to name the month, not just the year.
      </p>
      <DatingNote kind="dendro" />
      <div className="mt-10">
        <TimberSpotlightCard samples={samples} />
      </div>
    </div>
  );
}
