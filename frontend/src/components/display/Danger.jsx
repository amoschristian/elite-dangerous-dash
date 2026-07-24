export function Danger({ ctxData, hideTitle }) {
  if (hideTitle) return null;
  return (
    <div className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-danger">
      {ctxData?.interdicted
        ? "INTERDICTION DETECTED"
        : ctxData?.overheating
          ? "OVERHEATING — COOL DOWN"
          : "DANGER"}
    </div>
  );
}
