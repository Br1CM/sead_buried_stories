import { getTimberRingsIndex } from "@/lib/data";
import { TimberRingsPicker } from "@/components/TimberRingsPicker";
import { DatingNote } from "@/components/DatingNote";

export const metadata = { title: "Rings of a Building | Buried Stories" };

export default function TimberRingsPage() {
  const buildings = getTimberRingsIndex();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Rings of a Building</h1>
      <p className="mt-2 max-w-2xl text-ink-60">
        Every beam in an old building was once a tree, and every tree remembers the year it
        was cut. Pick a building and grow its rings outward, one dated timber at a time, to
        watch its construction and repair history unfold.
      </p>
      <DatingNote kind="dendro" />
      <div className="mt-8">
        <TimberRingsPicker buildings={buildings} />
      </div>
    </div>
  );
}
