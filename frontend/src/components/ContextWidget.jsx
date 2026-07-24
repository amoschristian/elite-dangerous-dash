import { AlertTriangle, Crosshair, Fuel, MapPin, Navigation, Ship } from "lucide-preact";
import { HoloBar } from "./HoloBar.jsx";

export function ContextWidget({ data }) {
  const ctx = data?.context;
  if (!ctx) return null;

  const { context, data: ctxData } = ctx;

  const card = (() => {
    switch (context) {
      case "docked":
        return <DockedCard data={ctxData} />;

      case "docking":
        return <DockingPad pad={ctxData?.landing_pad} />;

      case "docking_denied":
        return <DeniedPanel reason={ctxData?.reason} />;

      case "approach_settlement":
        return <GlideIndicator data={ctxData} />;

      case "approach_body":
        return <Altimeter body={ctxData?.body} altitude={ctxData?.altitude} radius={ctxData?.planet_radius} />;

      case "danger":
        return <DangerAlert interdicted={ctxData?.interdicted} />;

      case "fsd_jump":
        return <JumpCard destination={ctxData?.destination} jumpType={ctxData?.jump_type} starClass={ctxData?.star_class} />;

      case "fsd_charging":
        return <FsdTransition label={ctxData?.jump_type === "Hyperspace" ? "HYPERSPACE CHARGING" : "SUPERCRUISE CHARGING"} destination={ctxData?.destination} jumpType={ctxData?.jump_type} starClass={ctxData?.star_class} />;

      case "supercruise":
        return <SupercruiseCard current={data?.state?.location?.system?.StarSystem} destination={ctxData?.destination} />;

      case "low_fuel":
        return <FuelCard fuel={ctxData} />;

      default:
        return <NormalCard ship={ctxData?.ship} system={ctxData?.system} />;
    }
  })();

  return (
    <div className="bg-ed-panel/80 backdrop-blur-sm p-[var(--space-lg)] h-full" style={{ border: "var(--border) solid rgba(122, 63, 24, 0.3)" }}>
      {card}
    </div>
  );
}

/* ── docked ────────────────────────────────────── */
function DockedCard({ data }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-ed-holo-dim uppercase tracking-wider" style={{ fontSize: "var(--text-sm)" }}>Docked</div>
      <div className="font-bold glow-text" style={{ fontSize: "calc(var(--text-xl) * 1.4)" }}>{data?.station}</div>
      <div className="text-ed-holo-dim" style={{ fontSize: "var(--text-xl)" }}>{data?.government} &middot; {data?.economy}</div>
      <div className="text-ed-holo-dim" style={{ fontSize: "var(--text-xl)" }}>{data?.faction}</div>
    </div>
  );
}

/* ── docking ───────────────────────────────────── */
function DockingPad({ pad }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <Ship className="text-ed-accent" size={48} strokeWidth={1} />
      <div className="font-bold glow-text" style={{ fontSize: "var(--text-xl)" }}>Landing Pad {pad}</div>
      <div className="text-ed-holo-dim" style={{ fontSize: "var(--text-md)" }}>Proceed to assigned pad</div>
    </div>
  );
}

/* ── docking denied ────────────────────────────── */
function DeniedPanel({ reason }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
      <AlertTriangle className="text-ed-danger" size={48} strokeWidth={1} />
      <div className="font-bold text-ed-danger" style={{ fontSize: "var(--text-xl)" }}>Docking Denied</div>
      <div className="text-ed-holo-dim max-w-[80%]" style={{ fontSize: "var(--text-md)" }}>{reason || "Unknown reason"}</div>
    </div>
  );
}

/* ── approach settlement ───────────────────────── */
function GlideIndicator({ data }) {
  const { settlement, economy, services, altitude } = data ?? {};
  const fmtAlt = (v) => v != null ? v >= 1000 ? `${(v / 1000).toFixed(1)} km` : `${v.toFixed(0)} m` : "--";
  const s = typeof services === "string" ? services.split(",").map(s => s.trim()).filter(Boolean) : [];
  return (
    <div className="flex flex-col gap-2">
      <div className="text-ed-holo-dim uppercase tracking-wider" style={{ fontSize: "var(--text-sm)" }}>Approaching</div>
      <div className="font-bold glow-text" style={{ fontSize: "calc(var(--text-xl) * 1.4)" }}>{settlement || "Unknown"}</div>
      {economy && <div className="text-ed-holo-dim" style={{ fontSize: "var(--text-xl)" }}>{economy}</div>}
      <div className="text-[var(--text-xl)] text-ed-holo"><span className="text-ed-holo-dim text-[var(--text-xs)] uppercase">Alt </span>{fmtAlt(altitude)}</div>
      {s.length > 0 && (
        <div className="flex flex-wrap gap-[var(--space-xs)] text-[var(--text-xs)] uppercase tracking-wider text-ed-holo-dim/70">
          {s.map((svc) => <span key={svc}>{svc}</span>)}
        </div>
      )}
    </div>
  );
}

/* ── altimeter ─────────────────────────────────── */
function Altimeter({ body, altitude, radius }) {
  const ratio = radius > 0 ? Math.min((altitude ?? 0) / radius, 3) : 0;
  return (
    <div className="flex flex-col h-full gap-2">
      <div className="text-ed-holo-dim uppercase tracking-wider" style={{ fontSize: "var(--text-sm)" }}>Approaching</div>
      <div className="font-bold glow-text" style={{ fontSize: "var(--text-xl)" }}>{body}</div>
      <div className="text-ed-holo-dim" style={{ fontSize: "var(--text-l)" }}>{altitude?.toLocaleString()} m altitude</div>
      <HoloBar value={Math.round(ratio * 100)} label="Orbital depth" color={ratio > 1 ? "holo" : "warning"} />
    </div>
  );
}

/* ── danger ────────────────────────────────────── */
function DangerAlert({ interdicted }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <AlertTriangle className={interdicted ? "text-ed-danger animate-pulse" : "text-ed-danger"} size={48} strokeWidth={1} />
      <div className="font-bold text-ed-danger glow-text" style={{ fontSize: "var(--text-xl)" }}>
        {interdicted ? "INTERDICTION" : "DANGER"}
      </div>
      <div className="text-ed-holo-dim" style={{ fontSize: "var(--text-md)" }}>
        {interdicted ? "Submit or fight the interdiction" : "Hostile contact detected"}
      </div>
    </div>
  );
}

/* ── FSD jump ──────────────────────────────────── */
function JumpCard({ destination, jumpType, starClass }) {
  const isHyperspace = jumpType === "Hyperspace";
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <Navigation size={32} strokeWidth={1} className="text-ed-holo" />
      <div className="font-bold glow-text animate-pulse" style={{ fontSize: "var(--text-xl)" }}>
        {isHyperspace ? "HYPERSPACE JUMP" : "SUPERCRUISE"}
      </div>
      <div className="text-ed-accent" style={{ fontSize: "var(--text-md)" }}>{destination || "Unknown"}{starClass ? ` (${starClass})` : ""}</div>
    </div>
  );
}

/* ── FSD charging / cooldown ──────────────────── */
function FsdTransition({ label, destination, jumpType, starClass }) {
  const isHyperspace = jumpType === "Hyperspace";
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <div className="font-bold glow-text animate-pulse" style={{ fontSize: "var(--text-xl)" }}>{label}</div>
      {destination && <div className="text-ed-accent" style={{ fontSize: "var(--text-md)" }}>{destination}{starClass ? ` (${starClass})` : ""}</div>}
      <div className="text-ed-holo-dim" style={{ fontSize: "var(--text-sm)" }}>
        {label === "COOLDOWN" ? "Drive cooling down" : isHyperspace ? "Engaging hyperspace jump" : "Engaging supercruise"}
      </div>
    </div>
  );
}

/* ── supercruise ───────────────────────────────── */
function SupercruiseCard({ current, destination }) {
  return (
    <div className="flex flex-col h-full gap-3 item">
      <div className="text-ed-holo-dim uppercase tracking-wider" style={{ fontSize: "var(--text-sm)" }}>Supercruise</div>
      <div className="flex items-center gap-2">
        <MapPin size={14} strokeWidth={1} />
        <span style={{ fontSize: "var(--text-lg)" }}>{current || "Deep Space"}</span>
      </div>
      {destination && (
        <div className="flex items-center gap-2 text-ed-accent">
          <Navigation size={14} strokeWidth={1} />
          <span className="font-semibold" style={{ fontSize: "var(--text-xl)" }}>{destination}</span>
        </div>
      )}
    </div>
  );
}

/* ── low fuel ──────────────────────────────────── */
function FuelCard({ fuel }) {
  const { fuel_pct, fuel_main, fuel_capacity } = fuel ?? {};
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <Fuel className="text-ed-warning" size={40} strokeWidth={1} />
      <HoloBar value={fuel_pct ?? 0} label="Fuel" color="warning" showValue />
      <div className="text-ed-holo-dim" style={{ fontSize: "var(--text-sm)" }}>
        {fuel_main?.toFixed(1)} / {fuel_capacity?.toFixed(1)} T
      </div>
    </div>
  );
}

/* ── normal ────────────────────────────────────── */
function NormalCard({ ship, system }) {
  return (
    <div className="flex flex-col h-full gap-2 justify-center text-center">
      <div className="text-ed-holo-dim" style={{ fontSize: "calc(var(--text-xl) * 1.4)" }}>All systems nominal</div>
    </div>
  );
}
