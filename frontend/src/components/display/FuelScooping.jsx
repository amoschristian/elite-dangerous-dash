export function FuelScooping({ ctxData, hideTitle }) {
  if (hideTitle) return null;
  const eta = ctxData?.eta_seconds;
  return (
    <div className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-accent">
      {eta != null
        ? `FUEL SCOOPING — FULL IN ${Math.floor(eta / 60)}:${String(eta % 60).padStart(2, "0")}`
        : "FUEL SCOOPING"}
    </div>
  );
}
