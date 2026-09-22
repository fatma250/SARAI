import "../../styles/statistics-tokens.css";
import "./RankedBarList.css";

/**
 * Compact ranked list with inline bars - used for "Technologies IA les plus
 * adoptées" and "Organisations par pays". One flat accent color (not a
 * different hue per row): these are magnitude rankings of the *same*
 * metric, not distinct categories, so a rainbow of colors would imply a
 * distinction that isn't there.
 *
 * data: [{ label: "Analyse prédictive", value: 35 }, ...] - already sorted
 * descending by the caller.
 * `footnote`: optional string for folded long-tail items, e.g.
 *   "+ 3 technologies à 1 projet chacune : ..."
 */
export default function RankedBarList({ data, accent = "var(--stat-series-1)", footnote }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div>
      <div className="stat-rank-list">
        {data.map((d, i) => (
          <div className="stat-rank-row" key={d.label}>
            <span className="stat-rank-num">#{i + 1}</span>
            <span className="stat-rank-name">{d.label}</span>
            <span className="stat-rank-track">
              <span
                className="stat-rank-fill"
                style={{ width: `${(d.value / max) * 100}%`, background: accent }}
              />
            </span>
            <span className="stat-rank-val">{d.value}</span>
          </div>
        ))}
      </div>
      {footnote && <p className="stat-rank-note">{footnote}</p>}
    </div>
  );
}
