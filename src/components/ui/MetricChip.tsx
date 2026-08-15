export function MetricChip({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <span className={`ds-metric-chip ${className}`.trim()}>
      <span className="ds-metric-value">{value}</span>
      <span className="ds-metric-label">{label}</span>
    </span>
  );
}
