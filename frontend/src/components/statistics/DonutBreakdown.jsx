import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { CHART_COLORS_LIGHT, seriesColorList } from "../../styles/chartColors";
import "../../styles/statistics-tokens.css";
import "./DonutBreakdown.css";

/**
 * Donut + ranked legend, used for "Répartition par secteur" and
 * "Organisations par type". Pass already-cleaned data (see
 * utils/analyticsTransform.js: cleanSectors / cleanOrgTypes) so the
 * "Autres" bucket is already folded in and duplicate labels are merged.
 *
 * data: [{ name: "Énergie", value: 19 }, ...]  (an "Autres..." row, if any,
 * should be last - it renders in the neutral gray automatically)
 *
 * `colors`/`otherColor` take literal hex (not CSS var() strings) because
 * Recharts sets `fill` as an SVG attribute - pass CHART_COLORS_DARK-derived
 * values from your theme context when dark mode is active (see
 * pages/Analytics.example.jsx).
 */
export default function DonutBreakdown({ data, totalLabel = "Total", colors, otherColor }) {
  const palette = colors || seriesColorList(CHART_COLORS_LIGHT);
  const other = otherColor || CHART_COLORS_LIGHT.other;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const colorFor = (index, entry) => (entry.isOther ? other : palette[index % palette.length]);

  return (
    <div className="stat-donut-row">
      <div className="stat-donut-wrap">
        <PieChart width={132} height={132}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx={66}
            cy={66}
            innerRadius={46}
            outerRadius={62}
            paddingAngle={1.2}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={colorFor(i, entry)} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value} (${Math.round((value / total) * 100)}%)`, name]}
            contentStyle={{
              background: "var(--stat-text-primary)",
              color: "var(--stat-page-bg)",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </PieChart>
        <div className="stat-donut-center">
          <b>{total}</b>
          <span>{totalLabel}</span>
        </div>
      </div>
      <div className="stat-legend">
        {data.map((d, i) => (
          <div className="stat-legend-row" key={d.name}>
            <span className="stat-legend-swatch" style={{ background: colorFor(i, d) }} />
            <span className="stat-legend-name">{d.name}</span>
            <span className="stat-legend-val">{d.value}</span>
            <span className="stat-legend-pct">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
