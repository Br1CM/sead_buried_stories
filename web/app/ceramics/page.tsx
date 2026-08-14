import { getAllCeramicsPeriods } from "@/lib/data";
import { CeramicsExplorer } from "@/components/CeramicsExplorer";

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
      <div className="mt-8">
        <CeramicsExplorer periods={periods} />
      </div>
    </div>
  );
}
