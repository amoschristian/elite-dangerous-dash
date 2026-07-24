import { useState, useEffect } from "preact/hooks";
import { PanelFrame } from "../../components/PanelFrame.jsx";
import { Button } from "../../components/Button.jsx";
import { Globe, Rocket, Sword, PlaneLanding, Sun, VolumeX, Navigation, Package, Settings } from "lucide-preact";
import { NavTimeline } from "../../components/NavTimeline.jsx";
import { StatusDisplay } from "../../components/StatusDisplay.jsx";

const API = "http://127.0.0.1:8000";

const keypress = (action) => {
  fetch(`${API}/action?action=${action}`, { method: "GET" });
};

export function Dashboard() {
  const [data, setData] = useState(null);
  const [infoTab, setInfoTab] = useState("nav");
  const [isKiosk, setIsKiosk] = useState(false);

  const toggleMode = () => {
    const endpoint = isKiosk ? "/window/windowed" : "/window/kiosk";
    fetch(`${API}${endpoint}`);
    setIsKiosk(!isKiosk);
  };

  useEffect(() => {
    let cancelled = false;
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws`);

    ws.onmessage = (e) => {
      if (cancelled) return;
      const d = JSON.parse(e.data);
      setData(d);
    };

    ws.onerror = () => {
      fetch(`${API}/`).then(r => r.json()).then(d => { if (!cancelled) setData(d); }).catch(() => {});
    };

    return () => {
      cancelled = true;
      ws.close();
    };
  }, []);

  return (
    <div className="scanlines flex flex-col h-full w-full font-ed overflow-hidden bg-ed-bg text-ed-holo">
      <main className="flex flex-row h-full p-[var(--space-lg)] gap-[var(--space-lg)]">
        <div className="w-[30%] flex flex-col gap-[var(--space-lg)]">
          <PanelFrame title="INFORMATION" className="h-[100%]" isCombat={data?.isCombat ?? false}>
            <div className="flex flex-col h-full">
              

              {infoTab === "nav" && (
                <>
                  <div className="text-[var(--text-xs)] uppercase font-semibold text-ed-holo-dim">
                     Current System
                  </div>
                  <div className="text-[var(--text-xl)] font-bold tracking-wider glow-text truncate">
                    {data?.state?.location?.system?.StarSystem}
                  </div>
                  <NavTimeline navroute={data?.navroute} />
                </>
              )}

              {infoTab === "cargo" && (
                <div className="flex-1 flex items-center justify-center text-ed-holo-dim/40 text-[var(--text-sm)] uppercase tracking-widest">
                  Cargo — coming soon
                </div>
              )}

              <div className="flex flex-col gap-[var(--space-md)] mt-auto mb-[var(--space-lg)]">
                <div className="flex gap-[var(--space-md)] mb-[var(--space-md)]">
                  <Button
                    label="NAV"
                    icon={Navigation}
                    onClick={() => setInfoTab("nav")}
                    wide
                    active={infoTab === "nav"}
                    className={`h-[var(--btn-wide)] flex-1 ${infoTab === "nav" ? "!bg-ed-holo/15 !border-ed-holo/60" : ""}`}
                  />
                  <Button
                    label="CARGO"
                    icon={Package}
                    onClick={() => setInfoTab("cargo")}
                    wide
                    active={infoTab === "cargo"}
                    className={`h-[var(--btn-wide)] flex-1 ${infoTab === "cargo" ? "!bg-ed-holo/15 !border-ed-holo/60" : ""}`}
                  />
                </div>
              </div>
            </div>
          </PanelFrame>
        </div>

        <div className="w-[70%]">
          <PanelFrame className="h-full flex flex-col" isCombat={data?.isCombat ?? false}>
            <div className="flex-1 flex flex-col border border-ed-holo-dim/30 bg-black/60 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[var(--corner)] h-[var(--corner)] border-t border-l border-ed-holo-dim/50 pointer-events-none" />
              <div className="absolute top-0 right-0 w-[var(--corner)] h-[var(--corner)] border-t border-r border-ed-holo-dim/50 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[var(--corner)] h-[var(--corner)] border-b border-l border-ed-holo-dim/50 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-[var(--corner)] h-[var(--corner)] border-b border-r border-ed-holo-dim/50 pointer-events-none" />

              {/* ── ED.CO bar ─────────────────────────── */}
              <div className="shrink-0 flex items-center gap-[var(--space-sm)] p-[var(--space-md)] border-b border-ed-holo-dim/20">
                <span className="text-ed-holo-dim text-[var(--text-xs)] uppercase tracking-[0.2em] font-semibold">ED.CO</span>
                <span className="w-[var(--space-xs)] h-[var(--space-xs)] rounded-full bg-ed-holo animate-pulse" />
                <div className="flex-1" />
                <button
                  onClick={toggleMode}
                  className="text-ed-holo-dim/60 hover:text-ed-holo transition-colors"
                  title={isKiosk ? "Windowed" : "Kiosk"}
                >
                  <Settings size={16} />
                </button>
              </div>

              {/* ── Title → Sticky, Content → Scrollable ─ */}
              <StatusDisplay data={data} />

              {/* ── Fuel, Heat, Legal → Sticky ────────── */}
              {data?.context?.context && (
                <div className="shrink-0 border-t border-ed-holo-dim/20 px-[var(--space-lg)] pt-[var(--space-md)] pb-[var(--space-sm)] flex items-end gap-[var(--space-lg)]">
                  <div className="flex-1">
                    <div className="flex justify-between text-[var(--text-xs)] mb-1">
                      <span className="text-ed-holo uppercase tracking-wider">Fuel</span>
                      <span className="text-ed-holo font-ed-mono">
                        {(data?.status?.Fuel?.FuelMain ?? 0).toFixed(1)} / {(data?.state?.loadout?.fuel_capacity || 0).toFixed(1)} T
                      </span>
                    </div>
                    <div className="w-full h-[var(--space-sm)] bg-ed-panel border border-ed-holo-dim/30">
                      <div
                        className="h-full transition-all duration-500"
                        style={(() => {
                          const fm = data?.status?.Fuel?.FuelMain ?? 0;
                          const fc = data?.state?.loadout?.fuel_capacity || 0;
                          const pct = fc > 0 ? Math.min((fm / fc) * 100, 100) : 0;
                          const scooping = data?.context?.context === "fuel_scooping";
                          return {
                            width: `${pct}%`,
                            backgroundColor: fc > 0 && fm / fc < 0.25 ? "var(--color-ed-danger)" : scooping ? "var(--color-ed-accent)" : "var(--color-ed-holo)",
                            boxShadow: fc > 0 && fm / fc < 0.25
                              ? "0 0 6px var(--color-ed-danger)"
                              : scooping ? "0 0 6px var(--color-ed-accent)" : "0 0 6px var(--color-ed-holo)",
                          };
                        })()}
                      />
                    </div>
                  </div>
                  <div className="flex gap-[var(--space-lg)]">
                    <div className="text-right">
                      <span className="text-ed-holo text-[var(--text-xs)] uppercase tracking-wider">Heat</span>
                      <div className={`text-[var(--text-sm)] font-semibold font-ed-mono ${data?.status?.Flags?.is_overheating ? "text-ed-danger animate-pulse" : "text-ed-holo"}`}>
                        {data?.status?.Flags?.is_overheating ? "CRIT" : "NOM"}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-ed-holo text-[var(--text-xs)] uppercase tracking-wider">Legal</span>
                      <div className={`text-[var(--text-sm)] font-semibold font-ed-mono uppercase ${(data?.status?.LegalState ?? "Clean") !== "Clean" ? "text-ed-danger" : "text-ed-holo"}`}>
                        {(data?.status?.LegalState ?? "Clean") === "Clean" ? "CLN" : (data?.status?.LegalState ?? "").slice(0, 4)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Indicators ────────────────────────── */}
              <div className="shrink-0 border-t border-ed-holo-dim/20 px-[var(--space-md)] pt-[var(--space-sm)]">
                <div className="grid grid-cols-8 gap-[var(--space-xs)]">
                  {[
                    { key: "sc", label: "SC", active: true },
                    { key: "hs", label: "HS", active: true },
                    { key: "lg", label: "LG", active: data?.status?.Flags?.is_landing_gear_down },
                    { key: "lt", label: "LT", active: data?.status?.Flags?.is_lights_on },
                    { key: "hp", label: "HP", active: data?.status?.Flags?.is_hardpoints_deployed },
                    { key: "sr", label: "SR", active: data?.status?.Flags?.is_silent_running },
                    { key: "sh", label: "SHLD", active: data?.status?.Flags?.is_shields_up },
                    { key: "ml", label: "M.LOCK", active: data?.status?.Flags?.is_fsd_mass_locked },
                  ].map(({ key, label, active }) => (
                    <span
                      key={key}
                      className={`text-center text-[var(--text-xs)] uppercase tracking-widest font-semibold transition-colors ${
                        active ? "text-ed-holo glow-text" : "text-ed-holo-dim/40"
                      }`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* ── Buttons + Shield + M.Lock → Sticky ── */}
              <div className="shrink-0 px-[var(--space-md)] pb-[var(--space-sm)] grid grid-cols-8 gap-[var(--space-xs)]">
                <Button label="" icon={Globe} onClick={data?.status?.Flags?.is_fsd_cooldown ? undefined : () => keypress("supercruise")} active={!data?.status?.Flags?.is_fsd_cooldown} small green className="!w-auto !h-[4.5vw] !min-h-0" />
                <Button label="" icon={Rocket} onClick={data?.status?.Flags?.is_fsd_cooldown ? undefined : () => keypress("hyperspace")} active={!data?.status?.Flags?.is_fsd_cooldown} small green className="!w-auto !h-[4.5vw] !min-h-0" />
                <Button label="" icon={PlaneLanding} onClick={() => keypress("landing_gear")} active={data?.status?.Flags?.is_landing_gear_down} small className="!w-auto !h-[4.5vw] !min-h-0" />
                <Button label="" icon={Sun} onClick={() => keypress("lights")} active={data?.status?.Flags?.is_lights_on} small className="!w-auto !h-[4.5vw] !min-h-0" />
                <Button label="" icon={Sword} onClick={() => keypress("hardpoint")} active={data?.status?.Flags?.is_hardpoints_deployed} small className="!w-auto !h-[4.5vw] !min-h-0" />
                <Button label="" icon={VolumeX} onClick={() => keypress("silent_running")} active={data?.status?.Flags?.is_silent_running} small className="!w-auto !h-[4.5vw] !min-h-0" />
                <div className={`h-[4.5vw] border transition-colors flex items-center justify-center ${
                  data?.status?.Flags?.is_shields_up
                    ? "border-ed-accent bg-ed-accent/20 shadow-[0_0_8px_rgba(0,212,255,0.4)]"
                    : "border-ed-danger/50 bg-ed-danger/10 animate-pulse"
                }`}>
                  <div className={`w-[1.2vw] h-[1.2vw] rounded-full ${
                    data?.status?.Flags?.is_shields_up ? "bg-ed-accent" : "bg-ed-danger"
                  }`} />
                </div>
                <div className={`h-[4.5vw] border transition-colors flex items-center justify-center ${
                  data?.status?.Flags?.is_fsd_mass_locked
                    ? "border-ed-holo bg-ed-holo/20 animate-pulse"
                    : "border-ed-holo-dim/20 bg-ed-holo-dim/5"
                }`}>
                  <div className={`w-[1.2vw] h-[1.2vw] rounded-full ${
                    data?.status?.Flags?.is_fsd_mass_locked ? "bg-ed-holo shadow-[0_0_6px_rgba(255,127,42,0.6)]" : "bg-ed-holo-dim/30"
                  }`} />
                </div>
              </div>
            </div>
          </PanelFrame>
        </div>
      </main>
    </div>
  );
}
