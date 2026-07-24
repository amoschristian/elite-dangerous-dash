import { StarBadge } from "./StarBadge.jsx";

export function FsdJump({ ctxData, hideTitle }) {
  if (hideTitle) return null;
  return (
    <div className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-accent">
      HYPERSPACE JUMP → {ctxData?.destination || "--"}
      <StarBadge starClass={ctxData?.star_class} />
    </div>
  );
}
