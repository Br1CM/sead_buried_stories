import { getAllCeramicsPeriods } from "@/lib/data";
import { CeramicsExplorer } from "@/components/CeramicsExplorer";
import { DatingNote } from "@/components/DatingNote";

export const metadata = { title: "Ceramics Through Time | Buried Stories" };

export default function CeramicsPage() {
  const periods = getAllCeramicsPeriods();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Ceramics Through Time</h1>
      <p className="mt-2 max-w-2xl text-ink-60">
        Every pot tells potters&rsquo; recipes: what they mixed into the clay to keep it
        from cracking in the kiln. Step through the eras and watch the recipe change.
      </p>
      <a
        href="https://browser.sead.se/ceramic"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block rounded-full border border-accent/60 px-4 py-1.5 text-sm text-accent-text transition-colors hover:bg-accent/10"
      >
        Click here to explore ceramics in the SEAD Browser &#8599;
      </a>
      <DatingNote kind="bp" />
      <div className="mt-8">
        <CeramicsExplorer periods={periods} />
      </div>
    </div>
  );
}
