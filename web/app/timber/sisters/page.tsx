import { getSisterClusters } from "@/lib/data";
import { SisterBuildingsExplorer } from "@/components/SisterBuildingsExplorer";

export const metadata = { title: "Sister Buildings | Buried Stories" };

export default function SisterBuildingsPage() {
  const clusters = getSisterClusters();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Sister Buildings</h1>
      <p className="mt-2 max-w-2xl text-ink-60">
        Sometimes two buildings, hundreds of kilometers apart, turn out to share something:
        their timber was cut from the same forest region in the same few years &mdash; likely
        the same felling, maybe even the same shipment. These are the connections that survive
        by accident, in the wood itself.
      </p>
      <div className="mt-8">
        <SisterBuildingsExplorer clusters={clusters} />
      </div>
    </div>
  );
}
