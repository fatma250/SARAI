import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS_LIGHT } from "../../styles/chartColors";
import "../../styles/statistics-tokens.css";

/**
 * Replaces the current "Launch Timeline & Growth" chart. Two fixes vs. the
 * live version:
 *   1. The data from /api/analytics/projects-timeline is per-year counts,
 *      not cumulative (values go up AND down year to year) - this chart is
 *      labelled and shaped accordingly. If you want an actually-cumulative
 *      view, compute a running sum before passing `data` in and update the
 *      title/subtitle to say "cumulative".
 *   2. The current year is partial (todayâ€™s date falls inside it) - pass
 *      `partialYear` so that point gets a "(partiel)" annotation instead of
 *      implying a full year's total.
 *
 * data: [{ year: 2019, count: 10 }, ...]
 */
export default function ProjectsTimeline({ data, partialYear, colors }) {
  const palette = colors || CHART_COLORS_LIGHT;
  const maxIndex = data.reduce((best, d, i, arr) => (d.count > arr[best].count ? i : best), 0);
  const lastIndex = data.length - 1;

  const renderDot = (props) => {
    const { cx, cy, index } = props;
    const isHighlight = index === maxIndex || index === lastIndex;
    return (
      <circle
        key={`dot-${index}`}
        cx={cx}
        cy={cy}
        r={isHighlight ? 5 : 3.5}
        fill={palette.surface1 || "#fff"}
        stroke={palette.series1}
        strokeWidth={2}
      />
    );
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.series1} stopOpacity={0.22} />
              <stop offset="100%" stopColor={palette.series1} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={palette.gridline} />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tick={{ fill: palette.textMuted, fontSize: 10 }}
          />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: palette.textMuted, fontSize: 10 }} width={28} />
          <Tooltip
            formatter={(value, _name, item) => [
              `${value} projet${value > 1 ? "s" : ""}${item.payload.year === partialYear ? " (partiel)" : ""}`,
              "Lancements",
            ]}
            labelFormatter={(year) => year}
            contentStyle={{
              background: palette.textPrimary,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={palette.series1}
            strokeWidth={2}
            fill="url(#timelineFill)"
            dot={renderDot}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
