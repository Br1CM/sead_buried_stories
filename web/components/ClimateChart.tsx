"use client";

import { useMemo, useRef, useState } from "react";
import type { ClimatePoint } from "@/lib/types";

const WIDTH = 900;
const HEIGHT = 340;
const PAD = { top: 20, right: 20, bottom: 36, left: 44 };

export function ClimateChart({ series }: { series: ClimatePoint[] }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;

  const { yMin, yMax } = useMemo(() => {
    const lows = series.map((p) => p.range_low_c);
    const highs = series.map((p) => p.range_high_c);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const pad = (max - min) * 0.1;
    return { yMin: min - pad, yMax: max + pad };
  }, [series]);

  const x = (i: number) => PAD.left + (i / (series.length - 1)) * innerW;
  const y = (v: number) => PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const linePath = series.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.reconstructed_tmax_c)}`).join(" ");
  const bandPath =
    series.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.range_high_c)}`).join(" ") +
    " " +
    series
      .slice()
      .reverse()
      .map((p, i) => `L ${x(series.length - 1 - i)} ${y(p.range_low_c)}`)
      .join(" ") +
    " Z";

  const tickIndices = [0, Math.floor(series.length / 2), series.length - 1];

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const frac = (relX - PAD.left) / innerW;
    const idx = Math.round(frac * (series.length - 1));
    setHoverIndex(Math.max(0, Math.min(series.length - 1, idx)));
  }

  const active = hoverIndex !== null && hoverIndex < series.length ? series[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* y gridlines */}
        {[yMin, (yMin + yMax) / 2, yMax].map((v, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--ink-8)"
              strokeWidth={1}
            />
            <text x={PAD.left - 10} y={y(v)} textAnchor="end" dominantBaseline="middle" className="fill-ink-40 text-[11px]">
              {v.toFixed(0)}°
            </text>
          </g>
        ))}

        {/* uncertainty band */}
        <path d={bandPath} fill="var(--color-accent)" fillOpacity={0.12} />

        {/* reconstructed temperature line */}
        <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* x-axis labels */}
        {tickIndices.map((i) => (
          <text key={i} x={x(i)} y={HEIGHT - 10} textAnchor="middle" className="fill-ink-40 text-[11px]">
            {series[i].label}
          </text>
        ))}

        {/* hover crosshair */}
        {active && hoverIndex !== null && (
          <>
            <line
              x1={x(hoverIndex)}
              x2={x(hoverIndex)}
              y1={PAD.top}
              y2={HEIGHT - PAD.bottom}
              stroke="var(--ink-30)"
              strokeWidth={1}
            />
            <circle cx={x(hoverIndex)} cy={y(active.reconstructed_tmax_c)} r={4} fill="var(--color-accent)" />
          </>
        )}
      </svg>

      {active && (
        <div className="pointer-events-none absolute top-2 right-2 rounded-lg border border-cream-10 bg-overlay px-3 py-2 text-sm shadow-lg">
          <div className="font-medium text-cream-70">{active.label}</div>
          <div className="text-cream-60">~{active.reconstructed_tmax_c}°C (range {active.range_low_c}–{active.range_high_c}°C)</div>
          <div className="text-xs text-cream-30">from {active.n_samples} dated sample{active.n_samples === 1 ? "" : "s"}</div>
        </div>
      )}
    </div>
  );
}
