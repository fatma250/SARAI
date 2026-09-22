import "../../styles/statistics-tokens.css";
import "./StatKpiTile.css";

/**
 * A compact KPI tile: icon, label, big value, one line of real context
 * (a percentage or comparison) instead of a vague badge like "High".
 *
 * Optional `meter` prop renders a segmented progress bar for status-style
 * KPIs (e.g. ongoing vs completed projects) - pass an array of
 * { pct, color, label }.
 *
 * Example:
 *   <StatKpiTile
 *     icon={<GridIcon />}
 *     accent="var(--stat-series-1)"
 *     label="Projets IA"
 *     value={133}
 *     context="Toutes catégories confondues"
 *   />
 *
 *   <StatKpiTile
 *     icon={<PulseIcon />}
 *     accent="var(--stat-series-4)"
 *     label="Statut des projets"
 *     value={112}
 *     context={<>en cours (<b>84 %</b>)</>}
 *     meter={[
 *       { pct: 84.2, color: "var(--stat-series-1)", label: "En cours" },
 *       { pct: 13.5, color: "var(--stat-series-3)", label: "Terminés" },
 *       { pct: 2.3, color: "var(--stat-baseline)" },
 *     ]}
 *   />
 */
export default function StatKpiTile({ icon, accent = "var(--stat-series-1)", label, value, context, meter }) {
  return (
    <div className="stat-kpi" style={{ "--kpi-accent": accent }}>
      <div className="stat-kpi-top">
        <span className="stat-kpi-label">{label}</span>
        {icon && <span className="stat-kpi-icon">{icon}</span>}
      </div>
      <div className="stat-kpi-value">{value}</div>
      {context && <div className="stat-kpi-context">{context}</div>}
      {meter && (
        <>
          <div className="stat-meter">
            {meter.map((seg, i) => (
              <span key={i} style={{ width: `${seg.pct}%`, background: seg.color }} />
            ))}
          </div>
          <div className="stat-meter-legend">
            {meter
              .filter((seg) => seg.label)
              .map((seg, i) => (
                <span className="stat-meter-key" key={i}>
                  <span className="stat-meter-swatch" style={{ background: seg.color }} />
                  {seg.label}
                </span>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
