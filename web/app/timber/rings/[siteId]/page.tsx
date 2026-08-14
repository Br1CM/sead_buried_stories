import Image from "next/image";
import { notFound } from "next/navigation";
import { getTimberRingsDetail, getTimberRingsIndex } from "@/lib/data";
import { TimberRings } from "@/components/TimberRings";
import { LocatorMap } from "@/components/LocatorMap";
import { AttributionBadge } from "@/components/AttributionBadge";

export function generateStaticParams() {
  return getTimberRingsIndex().map((b) => ({ siteId: String(b.site_id) }));
}

export default async function TimberRingsDetailPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const building = getTimberRingsDetail(siteId);
  if (!building) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      {building.photo && (
        <div className="mb-6">
          <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-ink-10 sm:h-72">
            <Image
              src={building.photo.url}
              alt={building.site_name}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="mt-1">
            <AttributionBadge image={building.photo} />
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="h-40 w-full shrink-0 overflow-hidden rounded-2xl border border-ink-10 sm:w-64">
          <LocatorMap lat={building.lat} lon={building.lon} label={building.site_name} />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{building.site_name}</h1>
          <p className="mt-3 max-w-xl text-ink-70">
            {building.n_samples} individually dated timbers across {building.n_years}
            distinct felling years, spanning {building.earliest_label} to{" "}
            {building.latest_label}. Press play, or click any ring, to explore.
          </p>
        </div>
      </div>

      <TimberRings years={building.years} />
    </div>
  );
}
