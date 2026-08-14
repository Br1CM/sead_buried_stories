import { getClimateSeries } from "@/lib/data";
import { ClimateChart } from "@/components/ClimateChart";

export const metadata = { title: "The Ancient Thermometer | Buried Stories" };

export default function ClimatePage() {
  const series = getClimateSeries();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">The Ancient Thermometer</h1>
      <p className="mt-2 max-w-2xl text-ink-60">
        Beetles are picky: each species only survives within a narrow temperature range.
        So the mix of beetle species preserved in a dated layer brackets how warm that
        summer probably was &mdash; a thermometer built from dead insects. Hover the line
        to read a moment in time.
      </p>
      <div className="mt-8 rounded-2xl border border-ink-10 bg-ink-2 p-6">
        <ClimateChart series={series} />
        <p className="mt-4 text-xs text-ink-30">
          Shaded band shows the spread across all beetle species present at each point;
          the line is the average estimated summer maximum. Estimates from fewer samples
          (thin ends of the record) are noisier.
        </p>
      </div>
    </div>
  );
}
