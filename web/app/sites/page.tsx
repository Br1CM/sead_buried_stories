import { getSitesIndex } from "@/lib/data";
import { SitesMap } from "@/components/SitesMap";

export const metadata = { title: "Dig One Spot | Buried Stories" };

export default function SitesPage() {
  const sites = getSitesIndex();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Dig One Spot</h1>
      <p className="mt-2 max-w-2xl text-white/60">
        Pick a place and descend through it like an excavation: each layer below is a
        slice of time, with everything found buried in it. Hover a dot to see what&rsquo;s
        there, click to start digging.
      </p>
      <div className="mt-8">
        <SitesMap sites={sites} />
      </div>
    </div>
  );
}
