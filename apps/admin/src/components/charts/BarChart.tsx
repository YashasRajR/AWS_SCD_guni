/**
 * Minimal inline-SVG bar chart — no charting library needed for a plain
 * time series or breakdown. Renders a fixed-height row of bars scaled to
 * the max value, with a label under each bar.
 */
export interface BarChartDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartDatum[];
  height?: number;
  formatLabel?: (label: string) => string;
  color?: string;
}

export function BarChart({ data, height = 120, formatLabel, color = 'var(--brand)' }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 100 / data.length;

  return (
    <div className="bar-chart" style={{ height }}>
      {data.map((d, i) => {
        const barHeight = (d.value / max) * 100;
        return (
          <div
            key={i}
            className="bar-chart-col"
            style={{ width: `${barWidth}%` }}
            title={`${formatLabel ? formatLabel(d.label) : d.label}: ${d.value}`}
          >
            <div className="bar-chart-bar-track">
              <div className="bar-chart-bar" style={{ height: `${barHeight}%`, background: color }} />
            </div>
            <div className="bar-chart-label">{formatLabel ? formatLabel(d.label) : d.label}</div>
          </div>
        );
      })}
    </div>
  );
}
