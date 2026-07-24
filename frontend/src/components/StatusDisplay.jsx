import { Docked } from "./display/Docked.jsx";
import { Docking } from "./display/Docking.jsx";
import { DockingDenied } from "./display/DockingDenied.jsx";
import { Supercruise } from "./display/Supercruise.jsx";
import { FsdJump } from "./display/FsdJump.jsx";
import { FsdCharging } from "./display/FsdCharging.jsx";
import { Danger } from "./display/Danger.jsx";
import { LowFuel } from "./display/LowFuel.jsx";
import { FuelScooping } from "./display/FuelScooping.jsx";
import { ApproachBody } from "./display/ApproachBody.jsx";
import { ApproachSettlement } from "./display/ApproachSettlement.jsx";
import { Normal } from "./display/Normal.jsx";
import { StarBadge } from "./display/StarBadge.jsx";
import { BounceScroll } from "./BounceScroll.jsx";

/* ── Title only (rendered outside scroll area) ─────── */
function contextTitle(ctx, ctxData) {
  switch (ctx) {
    case "docked":
      return <span className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-holo">DOCKED: {ctxData?.station || "Unknown"}</span>;
    case "docking":
      return <span className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-accent">DOCKING — PROCEED TO PAD {ctxData?.landing_pad || "--"}</span>;
    case "docking_denied":
      return <span className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-danger">DOCKING DENIED — {ctxData?.reason || "unknown"}</span>;
    case "supercruise":
      return <span className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-holo">SUPERCRUISE → {ctxData?.destination || "Deep Space"}</span>;
    case "fsd_jump":
      return <span className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-accent">HYPERSPACE JUMP → {ctxData?.destination || "--"}<StarBadge starClass={ctxData?.star_class} /></span>;
    case "fsd_charging":
      return (() => {
        const isHyperspace = ctxData?.jump_type === "Hyperspace";
        const label = isHyperspace ? "HYPERSPACE CHARGING" : "SUPERCRUISE CHARGING";
        return <span className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-accent">{label} → {ctxData?.destination || "--"}{isHyperspace && <StarBadge starClass={ctxData?.star_class} />}</span>;
      })();
    case "fsd_cooldown":
      return null;
    case "danger":
      return <span className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-danger">{ctxData?.interdicted ? "INTERDICTION DETECTED" : ctxData?.overheating ? "OVERHEATING — COOL DOWN" : "DANGER"}</span>;
    case "low_fuel":
      return <span className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-warning">LOW FUEL — {ctxData?.fuel_pct?.toFixed(1)}%</span>;
    case "fuel_scooping":
      return (() => {
        const eta = ctxData?.eta_seconds;
        return <span className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-accent">{eta != null ? `FUEL SCOOPING — FULL IN ${Math.floor(eta / 60)}:${String(eta % 60).padStart(2, "0")}` : "FUEL SCOOPING"}</span>;
      })();
    case "approach_body":
      return <span className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-holo">APPROACHING - {ctxData?.body || "Unknown"}</span>;
    case "approach_settlement":
      return <span className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-holo">APPROACHING → {ctxData?.settlement || "Unknown"}</span>;
    case "normal":
      return (() => {
        const secColor = { "Anarchy": "text-ed-danger", "Low Security": "text-ed-warning", "Medium Security": "text-ed-holo", "High Security": "text-ed-green" }[ctxData?.security] ?? "text-ed-holo";
        return <span className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-holo">{ctxData?.system || "Unknown"}{ctxData?.security && <span className={`ml-[var(--space-sm)] text-[var(--text-lg)] ${secColor}`}>— {ctxData.security.toUpperCase()}</span>}</span>;
      })();
    default:
      return null;
  }
}

/* ── Body (inside scroll area, title hidden) ──────── */
const contextBody = (ctx, ctxData, flags, fuelMain, fuelCap, hullHealth, extra) => {
  const gearDown = flags?.is_landing_gear_down ?? false;
  const lightsOn = flags?.is_lights_on ?? false;
  const fuelPct = fuelCap > 0 ? (fuelMain / fuelCap) * 100 : 100;

  switch (ctx) {
    case "docked":           return <Docked ctxData={ctxData} fuelPct={fuelPct} hullHealth={hullHealth} navroute={extra.navroute} missions={extra.missions} destinationName={extra.destinationName} destinationSystem={extra.destinationSystem} currentSystem={extra.currentSystem} legalState={extra.legalState} hideTitle />;
    case "docking":          return <Docking ctxData={ctxData} gearDown={gearDown} lightsOn={lightsOn} hideTitle />;
    case "docking_denied":   return <DockingDenied ctxData={ctxData} hideTitle />;
    case "supercruise":      return <Supercruise ctxData={ctxData} hideTitle />;
    case "fsd_jump":         return <FsdJump ctxData={ctxData} hideTitle />;
    case "fsd_charging":     return <FsdCharging ctxData={ctxData} hideTitle />;
    case "fsd_cooldown":     return null;
    case "danger":           return <Danger ctxData={ctxData} hideTitle />;
    case "low_fuel":         return <LowFuel ctxData={ctxData} hideTitle />;
    case "fuel_scooping":    return <FuelScooping ctxData={ctxData} hideTitle />;
    case "approach_body":    return <ApproachBody ctxData={ctxData} hideTitle />;
    case "approach_settlement": return <ApproachSettlement ctxData={ctxData} hideTitle />;
    case "normal":            return <Normal ctxData={ctxData} hideTitle />;
    default:                   return null;
  }
};

export function StatusDisplay({ data }) {
  const ctx = data?.context?.context;
  const ctxData = data?.context?.data;
  const flags = data?.status?.Flags ?? {};
  const fuel = data?.status?.Fuel ?? {};
  const fuelMain = fuel.FuelMain ?? 0;
  const fuelCap = data?.state?.loadout?.fuel_capacity || 0;
  const hullHealth = data?.state?.loadout?.hull_health;
  const legal = data?.status?.LegalState ?? "Clean";

  if (!ctx) {
    return (
      <div className="flex-1 flex items-center justify-center p-[var(--space-lg)]">
        <span className="text-ed-holo text-[var(--text-md)] tracking-[0.5em] uppercase">STANDBY</span>
      </div>
    );
  }

  const extra = {
    navroute: data?.navroute ?? [],
    missions: data?.state?.missions ?? [],
    destinationName: data?.status?.Destination?.Name ?? "",
    destinationSystem: data?.status?.Destination?.System ?? 0,
    currentSystem: data?.state?.location?.system?.StarSystemAddress ?? 0,
    legalState: legal,
  };

  const title = contextTitle(ctx, ctxData);
  const body = contextBody(ctx, ctxData, flags, fuelMain, fuelCap, hullHealth, extra);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Title — fixed above scroll area */}
      {title && (
        <div className="shrink-0 px-[var(--space-lg)] pt-[var(--space-lg)] pb-[var(--space-sm)]">
          {title}
        </div>
      )}

      {/* Body — bouncing scroll */}
      <BounceScroll key={ctx} className="flex-1 overflow-hidden px-[var(--space-lg)]">
        <div className="flex flex-col gap-[var(--space-md)]">
          {body}
        </div>
      </BounceScroll>
    </div>
  );
}
