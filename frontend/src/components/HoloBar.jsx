export function HoloBar({ value = 0, label, color = "holo", showValue = true }) {
  const clamped = Math.max(0, Math.min(100, value));

  const colorVar =
    color === "accent" ? "var(--color-ed-accent)"
    : color === "danger" ? "var(--color-ed-danger)"
    : color === "warning" ? "var(--color-ed-warning)"
    : "var(--color-ed-holo)";

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-l mb-1">
          <span className="text-ed-holo-dim uppercase tracking-wider">{label}</span>
          {showValue && <span className="text-ed-holo font-mono">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className="w-full h-2 bg-ed-panel border border-ed-holo-dim/30">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${clamped}%`,
            backgroundColor: colorVar,
            boxShadow: `0 0 6px ${colorVar}`,
          }}
        />
      </div>
    </div>
  );
}
