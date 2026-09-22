import "../../styles/statistics-tokens.css";
import "./KeySignals.css";

/**
 * The 3-callout strip above the KPI row. This is the main "make it more
 * meaningful" lever: turn the raw numbers already on the page into 2-3
 * plain-language takeaways. Feed it the output of
 * utils/analyticsTransform.js#computeSignals and render your own sentences
 * with react-i18next - the French strings below are just the mockup copy.
 *
 * signals: [{ color, text }] - keep it to 3, each under ~2 lines.
 */
export default function KeySignals({ signals }) {
  return (
    <div className="stat-signals">
      {signals.map((s, i) => (
        <div className="stat-signal" key={i}>
          <span className="stat-signal-dot" style={{ background: s.color }} />
          <p>{s.text}</p>
        </div>
      ))}
    </div>
  );
}
