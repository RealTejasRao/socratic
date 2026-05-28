"use client";

import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MomentumPoint = {
  exchange: number;
  score: number;
  label: string | null;
};

type Props = {
  data: MomentumPoint[];
  className?: string;
};

type TooltipPayload = {
  payload?: ChartPoint;
};

type ChartPoint = MomentumPoint & {
  isCrossing?: boolean;
  positiveScore: number | null;
  negativeScore: number | null;
};

function MomentumTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="summary-chart-tooltip rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] shadow-sm">
      <p className="font-medium text-slate-950">Exchange {point.exchange}</p>
      <p className="mt-1 text-slate-600">{point.label || "No label"}</p>
      <p className="mt-1 text-slate-500">Score: {point.score}</p>
    </div>
  );
}

function findPoint(
  data: MomentumPoint[],
  picker: (current: MomentumPoint, next: MomentumPoint) => MomentumPoint,
) {
  return data.length > 0 ? data.reduce(picker) : null;
}

function toChartData(data: MomentumPoint[]) {
  const sorted = [...data].sort((a, b) => a.exchange - b.exchange);
  const chartData: ChartPoint[] = [];

  sorted.forEach((point, index) => {
    const previous = sorted[index - 1];

    if (
      previous &&
      previous.score !== 0 &&
      point.score !== 0 &&
      Math.sign(previous.score) !== Math.sign(point.score)
    ) {
      const exchangeDelta = point.exchange - previous.exchange;
      const scoreDelta = point.score - previous.score;
      const crossingExchange =
        previous.exchange + exchangeDelta * (-previous.score / scoreDelta);

      chartData.push({
        exchange: Number(crossingExchange.toFixed(2)),
        score: 0,
        label: null,
        isCrossing: true,
        positiveScore: 0,
        negativeScore: 0,
      });
    }

    chartData.push({
      ...point,
      positiveScore: point.score >= 0 ? point.score : null,
      negativeScore: point.score <= 0 ? point.score : null,
    });
  });

  return chartData;
}

export function DebateMomentumChart({ data, className }: Props) {
  const chartData = toChartData(data);
  const highest = findPoint(data, (current, next) =>
    next.score > current.score ? next : current,
  );
  const lowest = findPoint(data, (current, next) =>
    next.score < current.score ? next : current,
  );
  const showLowest =
    lowest && highest
      ? lowest.exchange !== highest.exchange || lowest.score !== highest.score
      : Boolean(lowest);

  if (data.length === 0) {
    return (
      <div
        className={`summary-chart-empty flex min-h-[260px] items-center justify-center border-y border-dashed border-slate-200 px-6 text-center text-[13px] leading-6 text-slate-500 ${className ?? ""}`}
      >
        Momentum data was not available for this debate. Future completed
        debates will show round-by-round movement here.
      </div>
    );
  }

  return (
    <div className={`summary-chart h-[320px] w-full ${className ?? ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 30, right: 24, bottom: 8, left: -12 }}
        >
          <CartesianGrid stroke="rgba(148, 163, 184, 0.22)" vertical={false} />
          <XAxis
            dataKey="exchange"
            type="number"
            domain={["dataMin", "dataMax"]}
            ticks={data.map((point) => point.exchange)}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--text-muted, #64748b)", fontSize: 12 }}
            tickFormatter={(value) => String(value)}
          />
          <YAxis
            domain={[-10, 10]}
            ticks={[-10, -5, 0, 5, 10]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--text-muted, #64748b)", fontSize: 12 }}
            width={36}
          />
          <Tooltip content={<MomentumTooltip />} cursor={false} />
          <ReferenceLine
            y={0}
            stroke="rgba(100, 116, 139, 0.55)"
            strokeDasharray="4 4"
          />
          <Line
            type="monotone"
            dataKey="positiveScore"
            stroke="#059669"
            strokeWidth={3}
            dot={({ cx, cy, payload }) => {
              const point = payload as ChartPoint;

              return point.isCrossing || point.positiveScore === null ? null : (
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill="#059669"
                  stroke="var(--background, #ffffff)"
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            isAnimationActive={false}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="negativeScore"
            stroke="#dc2626"
            strokeWidth={3}
            dot={({ cx, cy, payload }) => {
              const point = payload as ChartPoint;

              return point.isCrossing || point.negativeScore === null ? null : (
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill="#dc2626"
                  stroke="var(--background, #ffffff)"
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            isAnimationActive={false}
            connectNulls={false}
          />
          {highest?.label ? (
            <ReferenceDot
              x={highest.exchange}
              y={highest.score}
              r={4}
              fill="#059669"
              stroke="none"
            >
              <Label
                value={highest.label}
                position="top"
                fill="var(--text-primary, #0f172a)"
                fontSize={12}
              />
            </ReferenceDot>
          ) : null}
          {showLowest && lowest?.label ? (
            <ReferenceDot
              x={lowest.exchange}
              y={lowest.score}
              r={4}
              fill="#dc2626"
              stroke="none"
            >
              <Label
                value={lowest.label}
                position="bottom"
                fill="var(--text-primary, #0f172a)"
                fontSize={12}
              />
            </ReferenceDot>
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
