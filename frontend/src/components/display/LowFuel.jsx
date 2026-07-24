export function LowFuel({ ctxData, hideTitle }) {
  if (hideTitle) return null;
  return (
    <div className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-warning">
      LOW FUEL — {ctxData?.fuel_pct?.toFixed(1)}%
    </div>
  );
}
