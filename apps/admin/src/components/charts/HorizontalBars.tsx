/** Minimal inline-SVG-free horizontal bar breakdown — for a small set of
 * labeled counts (e.g. status breakdown) where a full bar chart is overkill. */
export interface HorizontalBarDatum {
  label: string;
  value: number;
  color?: string;
}

export function HorizontalBars({ data }: { data: HorizontalBarDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="horizontal-bars">
      {data.map((d, i) => (
        <div className="horizontal-bar-row" key={i}>
          <div className="horizontal-bar-label">{d.label}</div>
          <div className="horizontal-bar-track">
            <div
              className="horizontal-bar-fill"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color ?? 'var(--brand)' }}
            />
          </div>
          <div className="horizontal-bar-value">{d.value}</div>
        </div>
      ))}
    </div>
  );
}
