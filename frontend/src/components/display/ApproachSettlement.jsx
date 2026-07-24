import { Wrench, Fuel, ShoppingCart, Crosshair, StickyNote, Users } from "lucide-preact";

const SERVICE_ICONS = {
  "Refuel": Fuel,
  "Repair": Wrench,
  "Rearm": Crosshair,
  "Market": ShoppingCart,
  "Missions": StickyNote,
  "Crew Lounge": Users,
};

function ServicesList({ services }) {
  if (!services) return null;
  const list = typeof services === "string" ? services.split(",").map((s) => s.trim()).filter(Boolean) : services;
  if (list.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-[var(--space-sm)]">
      {list.map((s) => {
        const Icon = SERVICE_ICONS[s] || null;
        return (
          <span key={s} className="flex items-center gap-1 text-[var(--text-xs)] uppercase tracking-wider text-ed-holo-dim/80">
            {Icon && <Icon size={12} strokeWidth={1.5} />}
            {s}
          </span>
        );
      })}
    </div>
  );
}

export function ApproachSettlement({ ctxData, hideTitle }) {
  const { settlement, economy, services, altitude } = ctxData ?? {};

  const fmtAlt = (v) => {
    if (v == null) return "--";
    if (v >= 1000) return `${(v / 1000).toFixed(1)} km`;
    return `${v.toFixed(0)} m`;
  };

  return (
    <div>
      {!hideTitle && (
        <div className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-holo mb-[var(--space-md)]">
          APPROACHING → {settlement || "Unknown"}
        </div>
      )}

      {economy && (
        <div className="text-ed-holo-dim text-[var(--text-sm)] uppercase tracking-wider mb-[var(--space-md)]">
          {economy}
        </div>
      )}

      <div className="text-[var(--text-xs)] uppercase tracking-widest text-ed-holo-dim/80 mb-1">Altitude</div>
      <div className="text-[var(--text-sm)] font-bold text-ed-holo mb-[var(--space-md)]">{fmtAlt(altitude)}</div>

      <ServicesList services={services} />
    </div>
  );
}
