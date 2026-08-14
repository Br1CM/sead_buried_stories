import type { TemperStat } from "@/lib/types";

export function TemperChart({ temper }: { temper: TemperStat[] }) {
  const shown = temper.filter((t) => t.pct_present !== null).slice(0, 8);

  if (shown.length === 0) {
    return <p className="text-sm text-ink-40">No tempering data recorded for this period.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {shown.map((t) => (
        <div key={t.material} className="flex items-center gap-3">
          <span className="w-40 shrink-0 text-right text-sm text-ink-70">{t.material}</span>
          <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-ink-5">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.max(t.pct_present ?? 0, 2)}%` }}
            />
          </div>
          <span className="w-14 shrink-0 text-sm tabular-nums text-ink-50">
            {t.pct_present}%
          </span>
        </div>
      ))}
      <p className="mt-1 text-xs text-ink-30">
        Share of analysed pottery samples where each tempering material was identified.
      </p>
    </div>
  );
}
