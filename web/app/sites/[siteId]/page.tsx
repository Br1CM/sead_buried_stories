import Image from "next/image";
import { notFound } from "next/navigation";
import { getSiteDetail, getSitesIndex } from "@/lib/data";
import { SiteDig } from "@/components/SiteDig";
import { LocatorMap } from "@/components/LocatorMap";
import { AttributionBadge } from "@/components/AttributionBadge";

export function generateStaticParams() {
  return getSitesIndex().map((s) => ({ siteId: String(s.site_id) }));
}

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const site = getSiteDetail(siteId);
  if (!site) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      {site.photo && (
        <div className="mb-6">
          <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-ink-10 sm:h-72">
            <Image
              src={site.photo.url}
              alt={site.photo.depicts}
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-2 pt-8 text-xs text-ink-70">
              {site.photo.depicts.toLowerCase() === site.site_name.toLowerCase()
                ? "The site today"
                : `The area around ${site.photo.depicts} today — the exact excavation is long since backfilled`}
            </div>
          </div>
          <div className="mt-1">
            <AttributionBadge image={site.photo} />
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="h-40 w-full shrink-0 overflow-hidden rounded-2xl border border-ink-10 sm:w-64">
          <LocatorMap lat={site.lat} lon={site.lon} label={site.site_name} />
        </div>
        <div>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">{site.site_name}</h1>
            <a
              href={`https://browser.sead.se/site/${site.site_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap rounded-full border border-accent/60 px-3 py-1 text-sm text-accent-text transition-colors hover:bg-accent/10"
            >
              Explore this site in SEAD &#8599;
            </a>
          </div>
          <p className="mt-3 max-w-xl text-ink-70">
            {site.n_layers} distinct dated layers, {site.n_taxa} species identified in
            total, spanning {site.oldest_label} to {site.youngest_label}. Tap a layer to
            see what was living there.
          </p>
        </div>
      </div>

      <SiteDig layers={site.layers} />
    </div>
  );
}
