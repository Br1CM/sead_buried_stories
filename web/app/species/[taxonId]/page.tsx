import Image from "next/image";
import { notFound } from "next/navigation";
import { getSpeciesDetail, getSpeciesIndex } from "@/lib/data";
import { SpeciesStory } from "@/components/SpeciesStory";
import { AttributionBadge } from "@/components/AttributionBadge";

export function generateStaticParams() {
  return getSpeciesIndex().map((s) => ({ taxonId: String(s.taxon_id) }));
}

export default async function SpeciesDetailPage({
  params,
}: {
  params: Promise<{ taxonId: string }>;
}) {
  const { taxonId } = await params;
  const species = getSpeciesDetail(taxonId);
  if (!species) notFound();

  const displayName = species.common_name_en ?? species.common_name_local ?? species.scientific_name;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl bg-white/5">
          {species.image ? (
            <Image
              src={species.image.url}
              alt={displayName}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-white/20">
              ?
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{displayName}</h1>
          <p className="italic text-white/50">{species.scientific_name}</p>
          <p className="mt-3 max-w-xl text-white/70">
            Found at {species.n_sites} dated sites across {species.n_finds} separate finds,
            spanning {species.oldest_label} to {species.youngest_label}. Drag the slider
            below to follow it through time.
          </p>
          <div className="mt-2">
            <AttributionBadge image={species.image} />
          </div>
        </div>
      </div>

      <SpeciesStory stops={species.path} />
    </div>
  );
}
