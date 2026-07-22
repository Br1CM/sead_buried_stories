import { notFound } from "next/navigation";
import { getSiteDetail, getSitesIndex } from "@/lib/data";
import { SiteDig } from "@/components/SiteDig";
import { LocatorMap } from "@/components/LocatorMap";

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
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="h-40 w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:w-64">
          <LocatorMap lat={site.lat} lon={site.lon} label={site.site_name} />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{site.site_name}</h1>
          <p className="mt-3 max-w-xl text-white/70">
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
