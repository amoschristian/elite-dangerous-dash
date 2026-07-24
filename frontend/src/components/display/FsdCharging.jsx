import { StarBadge } from "./StarBadge.jsx";

export function FsdCharging({ ctxData, hideTitle }) {
  if (hideTitle) return null;
  const isHyperspace = ctxData?.jump_type === "Hyperspace";
  const label = isHyperspace ? "HYPERSPACE CHARGING" : "SUPERCRUISE CHARGING";
  const destination = ctxData?.destination || "--";

  return (
    <div className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-accent">
      {label} → {destination}
      {isHyperspace && <StarBadge starClass={ctxData?.star_class} />}
    </div>
  );
}
