import "../../styles/statistics-tokens.css";
import "./CountryLeaderboard.css";

/**
 * Replaces the current 22-bar vertical chart (rotated, hard-to-read
 * country labels) with a two-column ranked list. Splitting into two DOM
 * chunks and letting CSS grid auto-flow row-wise across 2 columns produces
 * a clean "snake" reading order (1,2 / 3,4 / 5,6 / ...).
 *
 * data: [{ name: "Égypte", value: 11 }, ...] already sorted descending,
 * all 22 countries - no need to cap/paginate, this layout scales fine.
 */
export default function CountryLeaderboard({ data, accent = "var(--stat-series-1)" }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="stat-board">
      {data.map((d, i) => (
        <div className="stat-board-row" key={d.name}>
          <span className="stat-board-rank">{i + 1}</span>
          <span className="stat-board-mid">
            <span className="stat-board-name">{d.name}</span>
            <span className="stat-board-track">
              <span
                className="stat-board-fill"
                style={{ width: `${(d.value / max) * 100}%`, background: accent }}
              />
            </span>
          </span>
          <span className="stat-board-val">{d.value}</span>
        </div>
      ))}
    </div>
  );
}
