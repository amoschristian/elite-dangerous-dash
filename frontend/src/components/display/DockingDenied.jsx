export function DockingDenied({ ctxData, hideTitle }) {
  if (hideTitle) return null;
  return (
    <div className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-danger">
      DOCKING DENIED — {ctxData?.reason || "unknown"}
    </div>
  );
}
