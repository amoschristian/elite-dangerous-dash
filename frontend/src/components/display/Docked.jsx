import { useState } from "preact/hooks";
import { Button } from "../Button.jsx";
import { playClick } from "../../sound.js";

const STATUS_COLOR = {
  "OK":     "text-ed-green",
  "NEED":   "text-ed-danger",
  "CHECK":  "text-ed-warning",
  "NONE":   "text-ed-danger",
  "WANTED": "text-ed-danger",
  "FINED":  "text-ed-warning",
  "CLN":    "text-ed-green",
  "N/A":    "text-ed-holo-dim/60",
};

function ChecklistRow({ label, detail, status, pulse, dimmed }) {
  const rowClass = dimmed
    ? "text-ed-holo-dim/40"
    : pulse
      ? "text-ed-holo animate-pulse"
      : "text-ed-holo";

  return (
    <div className={`text-[var(--text-sm)] flex items-center gap-[var(--space-sm)] ${rowClass}`}>
      <span className="uppercase tracking-wider shrink-0">{label}</span>
      {detail != null && detail !== "" && (
        <span className={`text-[var(--text-xs)] ${dimmed ? "text-ed-holo-dim/50" : "text-ed-holo/70"}`}>
          {detail}
        </span>
      )}
      <span className="flex-1 border-b border-dotted border-ed-holo-dim/40" />
      <span className={`font-semibold ${STATUS_COLOR[status] ?? "text-ed-holo-dim/60"}`}>
        {status}
      </span>
    </div>
  );
}

export function Docked({ ctxData, fuelPct, hullHealth, navroute, missions, destinationName, destinationSystem, currentSystem, legalState, hideTitle }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const services = ctxData?.services || [];
  const has = (s) => services.includes(s);

  // ── Build checklist items ──────────────────────────
  const refuelOk = fuelPct >= 100;
  const refuelAvailable = has("refuel");

  const hullOk = (hullHealth ?? 1) >= 1;
  const repairAvailable = has("repair");

  // Destination — use system address to avoid string-mismatch from Elite
  let destStatus = "NONE";
  let destDetail = "";
  const atDestination = (destinationSystem && currentSystem)
    ? destinationSystem === currentSystem
    : false;
  if (navroute && navroute.length > 0) {
    destDetail = navroute[0]?.name ?? "";
    destStatus = destDetail && !atDestination ? "OK" : "NONE";
  } else if (destinationName && !atDestination) {
    destDetail = destinationName;
    destStatus = "OK";
  }

  // Missions
  const missionCount = missions?.length ?? 0;

  // Legal
  const legal = legalState ?? "Clean";

  const items = [
    {
      label: "REFUEL",
      detail: `${fuelPct.toFixed(0)}%`,
      status: refuelOk ? "OK" : "NEED",
      pulse: !refuelOk && refuelAvailable,
      dimmed: false,
    },
    {
      label: "REPAIR",
      detail: hullHealth != null ? `${(hullHealth * 100).toFixed(0)}%` : "",
      status: hullOk ? "OK" : "NEED",
      pulse: !hullOk && repairAvailable,
      dimmed: false,
    },
    {
      label: "REARM",
      detail: "",
      status: has("rearm") ? "CHECK" : "N/A",
      pulse: false,
      dimmed: !has("rearm"),
    },
    {
      label: "DESTINATION",
      detail: destDetail,
      status: destStatus,
      pulse: destStatus === "NONE",
      dimmed: false,
    },
    {
      label: missionCount > 0 ? `MISSIONS (${missionCount})` : "MISSIONS",
      detail: "",
      status: missionCount === 0 ? "OK" : "CHECK",
      pulse: false,
      dimmed: false,
    },
    {
      label: "LEGAL",
      detail: "",
      status: legal === "Clean" ? "CLN" : legal.slice(0, 7).toUpperCase(),
      pulse: legal !== "Clean",
      dimmed: false,
    },
  ];

  const needsAttention = items.filter(
    i => i.status === "NEED" || i.status === "NONE" || i.status === "WANTED"
  );

  const hasWarnings = needsAttention.length > 0;

  // ── Acknowledged State ─────────────────────────────
  if (acknowledged) {
    return (
      <div>
        {!hideTitle && (
          <div className="pb-[var(--space-sm)]">
            <div className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-holo">
              DOCKED: {ctxData?.station || "Unknown"}
            </div>
          </div>
        )}

        {ctxData?.faction && (
          <div className="text-ed-holo text-[var(--text-sm)] mt-[var(--space-sm)]">
            {ctxData.faction}{ctxData.government ? ` — ${ctxData.government}` : ""}
          </div>
        )}

        <div className="flex flex-col items-center justify-center mt-[var(--space-lg)] py-[var(--space-lg)] gap-[var(--space-md)] border border-ed-green/40 bg-ed-green/5 relative">
          <div className="absolute top-0 left-0 w-[var(--corner)] h-[var(--corner)] border-t border-l border-ed-green/50 pointer-events-none" />
          <div className="absolute top-0 right-0 w-[var(--corner)] h-[var(--corner)] border-t border-r border-ed-green/50 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[var(--corner)] h-[var(--corner)] border-b border-l border-ed-green/50 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[var(--corner)] h-[var(--corner)] border-b border-r border-ed-green/50 pointer-events-none" />

          <div
            className="text-ed-green text-[var(--text-lg)] font-bold tracking-[0.3em] uppercase glow-text"
            style={{ textShadow: "0 0 4px var(--color-ed-green), 0 0 12px rgba(42,255,127,0.4)" }}
          >
            ✓ All Systems Nominal
          </div>
          <div className="text-ed-green/80 text-[var(--text-sm)] tracking-[0.5em] uppercase">
            Ready for Departure
          </div>
          <div className="mt-[var(--space-md)]">
            <Button label="RESET" onClick={() => { setAcknowledged(false); fetch("http://127.0.0.1:8000/focus"); }} small />
          </div>
        </div>

      </div>
    );
  }

  // ── Checklist State ───────────────────────────────
  return (
    <div>
      {!hideTitle && (
        <div className="pb-[var(--space-sm)]">
          <div className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-holo">
            DOCKED: {ctxData?.station || "Unknown"}
          </div>
        </div>
      )}

      {ctxData?.faction && (
        <div className="text-ed-holo text-[var(--text-sm)] mt-[var(--space-sm)]">
          {ctxData.faction}{ctxData.government ? ` — ${ctxData.government}` : ""}
        </div>
      )}

      {/* ── Pre-Launch Checklist ── */}
      <div className="flex flex-col gap-[var(--space-sm)] mt-[var(--space-lg)]">
        <div className="text-ed-holo text-[var(--text-xs)] uppercase tracking-widest flex items-center justify-between">
          <span>PRE-LAUNCH CHECKLIST</span>
          {hasWarnings && (
            <span className="text-ed-warning text-[var(--text-xxs)] animate-pulse">
              {needsAttention.length} ITEM{needsAttention.length !== 1 ? "S" : ""} NEED ATTENTION
            </span>
          )}
        </div>

        {items.map((item, i) => (
          <ChecklistRow key={i} {...item} />
        ))}
      </div>

      {/* ── Acknowledge Button ── */}
      <div className="sticky bottom-0 pt-[var(--space-md)] pb-[var(--space-sm)] bg-ed-bg border-t border-ed-holo-dim/10">
        <div
          className={`border p-[var(--space-md)] flex items-center justify-between cursor-pointer transition-colors ${
            hasWarnings
              ? "border-ed-warning/30 bg-ed-warning/5 hover:border-ed-warning/60 hover:bg-ed-warning/10"
              : "border-ed-green/30 bg-ed-green/5 hover:border-ed-green/60 hover:bg-ed-green/10"
          }`}
          onClick={() => { playClick(); setAcknowledged(true); fetch("http://127.0.0.1:8000/focus"); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { playClick(); setAcknowledged(true); fetch("http://127.0.0.1:8000/focus"); } }}
        >
          <span className="text-[var(--text-md)] font-bold tracking-[0.3em] uppercase text-ed-holo">
            ACKNOWLEDGE
          </span>
          {hasWarnings && (
            <span className="text-ed-warning text-[var(--text-xs)] uppercase tracking-wider">
              ⚠ Override
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
