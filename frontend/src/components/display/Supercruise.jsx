export function Supercruise({ ctxData, hideTitle }) {
  if (hideTitle) return null;
  return (
    <div className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-holo">
      SUPERCRUISE → {ctxData?.destination || "Deep Space"}
    </div>
  );
}
