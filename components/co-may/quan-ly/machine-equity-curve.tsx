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
  // Build cumulative balance points across time. Start = capital. Apply each non-anchor-change tx.
  const sorted = [...tx]
    .filter((t) => t.type !== "anchor_change")
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const points: { x: number; y: number }[] = [{ x: 0, y: capital }];
  let bal = capital;
  sorted.forEach((t, i) => {
    bal += t.amount;
    points.push({ x: i + 1, y: bal });
  });

  const W = 640;
  const H = 220;
  const PAD_X = 16;
  const PAD_Y = 16;
  const PAD_RIGHT = 56;
  const innerW = W - PAD_X - PAD_RIGHT;
  const innerH = H - 2 * PAD_Y;

  const minY = Math.min(...points.map((p) => p.y), capital * 0.3);
  const maxY = Math.max(...points.map((p) => p.y), capital * 1.1);
  const rangeY = maxY - minY || 1;
  const maxX = points[points.length - 1].x || 1;

  const sx = (x: number) => PAD_X + (x / maxX) * innerW;
  const sy = (y: number) => PAD_Y + (1 - (y - minY) / rangeY) * innerH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`)
    .join(" ");

  const areaPath =
    `M ${sx(points[0].x).toFixed(2)} ${sy(minY).toFixed(2)} ` +
    points.map((p) => `L ${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`).join(" ") +
    ` L ${sx(points[points.length - 1].x).toFixed(2)} ${sy(minY).toFixed(2)} Z`;

  const sortedMilestones = milestones ? [...milestones].sort((a, b) => b - a) : [];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <h3 className="text-base md:text-lg font-semibold text-foreground">Đường vốn</h3>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="220"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="eq-machine-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CD9C20" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#CD9C20" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Milestones — dashed horizontal lines + label on right */}
        {sortedMilestones.map((m) => {
          if (m < minY || m > maxY) return null;
          const y = sy(m);
          return (
            <g key={m}>
              <line
                x1={PAD_X}
                x2={W - PAD_RIGHT}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.15"
                strokeDasharray="2 4"
              />
              <text
                x={W - PAD_RIGHT + 6}
                y={y + 3}
                fontSize="10"
                className="fill-muted-foreground tabular-nums"
              >
                {usd.format(m)}
              </text>
            </g>
          );
        })}

        {/* Area + line */}
        <path d={areaPath} fill="url(#eq-machine-fill)" />
        <path d={linePath} fill="none" stroke="#CD9C20" strokeWidth="1.75" />
        {/* Markers */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={i === points.length - 1 ? 3.5 : 2}
            fill="#CD9C20"
          />
        ))}
      </svg>
    </div>
  );
}
