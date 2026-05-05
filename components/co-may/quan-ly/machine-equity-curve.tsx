"use client";

import type { MachineTransaction } from "@/lib/co-may/types";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

interface Props {
  capital: number;
  /** Tx của machine, sorted ASC theo time. */
  tx: MachineTransaction[];
  milestones?: number[];
}

export function MachineEquityCurve({ capital, tx, milestones }: Props) {
  const sorted = [...tx]
    .filter((t) => t.type !== "anchor_change")
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const points: { x: number; y: number }[] = [{ x: 0, y: capital }];
  let bal = capital;
  sorted.forEach((t, i) => {
    bal += t.amount;
    points.push({ x: i + 1, y: bal });
  });

  // Range: include capital, all balance points, all milestones — đảm bảo lines không chồng.
  const ms = milestones ?? [];
  const collect = [...points.map((p) => p.y), ...ms, capital];
  const minRaw = Math.min(...collect);
  const maxRaw = Math.max(...collect);
  // Padding 8% để lines không sát biên
  const padding = Math.max(1, (maxRaw - minRaw) * 0.08);
  const minY = minRaw - padding;
  const maxY = maxRaw + padding;
  const rangeY = maxY - minY || 1;
  const maxX = Math.max(1, points[points.length - 1].x);

  // Track-style chart: render labels via HTML positioned outside SVG để font không bị stretch.
  const sortedMilestones = [...ms].sort((a, b) => b - a);

  // Heights:
  const H_PX = 240;
  const PAD_TOP = 24;
  const PAD_BOTTOM = 24;
  const innerH = H_PX - PAD_TOP - PAD_BOTTOM;

  // SVG width: dùng "auto-stretch" qua viewBox = 100x100 và preserveAspectRatio none.
  // Labels nằm OUTSIDE svg nên không bị stretch.
  const svgViewW = 100;
  const svgViewH = 100;

  const sx = (x: number) => (x / maxX) * svgViewW;
  const sy = (y: number) => (1 - (y - minY) / rangeY) * svgViewH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`)
    .join(" ");

  const areaPath =
    `M ${sx(points[0].x).toFixed(2)} ${svgViewH} ` +
    points.map((p) => `L ${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`).join(" ") +
    ` L ${sx(points[points.length - 1].x).toFixed(2)} ${svgViewH} Z`;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h3 className="text-lg md:text-xl font-bold text-foreground">Đường vốn</h3>

      <div className="relative" style={{ height: H_PX }}>
        {/* Chart area — left, leaves 84px right margin for labels */}
        <div
          className="absolute inset-y-0 left-0 right-[84px]"
          style={{ paddingTop: PAD_TOP, paddingBottom: PAD_BOTTOM }}
        >
          <div className="relative h-full w-full">
            <svg
              viewBox={`0 0 ${svgViewW} ${svgViewH}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              <defs>
                <linearGradient id="eq-machine-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#CD9C20" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#CD9C20" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Milestone dashed lines */}
              {sortedMilestones.map((m) => {
                if (m < minY || m > maxY) return null;
                const y = sy(m);
                return (
                  <line
                    key={m}
                    x1={0}
                    x2={svgViewW}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.18"
                    strokeDasharray="0.4 0.8"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}

              {/* Area + line */}
              <path d={areaPath} fill="url(#eq-machine-fill)" />
              <path
                d={linePath}
                fill="none"
                stroke="#CD9C20"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Markers */}
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={sx(p.x)}
                  cy={sy(p.y)}
                  r={i === points.length - 1 ? 1.2 : 0.8}
                  fill="#CD9C20"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Labels — HTML overlay (font không bị stretch) */}
        <div
          className="absolute right-0 top-0 bottom-0 w-[84px]"
          style={{ paddingTop: PAD_TOP, paddingBottom: PAD_BOTTOM }}
        >
          <div className="relative h-full w-full">
            {sortedMilestones.map((m) => {
              if (m < minY || m > maxY) return null;
              const yPct = (1 - (m - minY) / rangeY) * 100;
              return (
                <div
                  key={m}
                  className="absolute right-0 -translate-y-1/2 text-sm font-bold text-foreground/80 tabular-nums tracking-tight"
                  style={{ top: `${yPct}%` }}
                >
                  {usd.format(m)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
