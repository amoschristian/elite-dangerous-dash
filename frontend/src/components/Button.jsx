import { useState, useRef, useCallback, useEffect } from "preact/hooks";
import {
  Map, Globe, Rocket, Equal, Sword, PlaneLanding, Sun, Moon, Package,
  VolumeX, Zap, Crosshair, Shield, Plane, Maximize2, Eye, Target,
} from "lucide-preact";
import { playClick, startHoldCharge, updateHoldCharge, stopHoldCharge } from "../sound.js";

const colors = {
  orange: {
    text: "text-ed-holo",
    textDim: "text-ed-holo-dim",
    border: "border-ed-holo-dim/30",
    borderHover: "hover:border-ed-holo/40",
    bar: "bg-ed-holo",
    barDim: "bg-ed-holo-dim/60",
    barShadow: "shadow-[0_0_8px_rgba(255,127,42,0.7)]",
    pipShadow: "shadow-[0_0_6px_rgba(255,127,42,0.7)]",
    pipDim: "bg-ed-holo-dim/15",
  },
  green: {
    text: "text-ed-green",
    textDim: "text-ed-green-dim",
    border: "border-ed-green-dim/30",
    borderHover: "hover:border-ed-green/40",
    bar: "bg-ed-green",
    barDim: "bg-ed-green-dim/60",
    barShadow: "shadow-[0_0_8px_rgba(42,255,127,0.7)]",
    pipShadow: "shadow-[0_0_6px_rgba(42,255,127,0.7)]",
    pipDim: "bg-ed-green-dim/15",
  },
};

const iconMap = {
  "System Map": Map,
  "Galaxy Map": Globe,
  "Frame Shift Drive": Rocket,
  Balance: Equal,
  Hardpoint: Target,
  Hardpoints: Sword,
  "Landing Gear": PlaneLanding,
  Lights: Sun,
  "Night Vision": Moon,
  "Cargo Scoop": Package,
  "Silent Running": VolumeX,
  "Engine Pips": Zap,
  "Weapon Pips": Crosshair,
  "System Pips": Shield,
  "Flight Assist": Plane,
  Inc: Maximize2,
  "Analysis Mode": Eye,
  Engine: Zap,
  Weapon: Crosshair,
  System: Shield,
};

export function Button({
  label,
  onClick = () => {},
  active,
  hold = false,
  holdDuration = 1900,
  wide = false,
  small = false,
  icon = null,
  pips,
  maxPips = 4,
  className = "",
  green = false,
  chargeSound = false,
}) {
  const c = green ? colors.green : colors.orange;
  const Icon = icon || iconMap[label];
  const isToggle = active !== undefined;

  const [progress, setProgress] = useState(0);
  const holding = useRef(false);
  const startTime = useRef(0);
  const raf = useRef(null);

  const animate = useCallback(() => {
    if (!holding.current) return;
    const elapsed = Date.now() - startTime.current;
    const p = Math.min(elapsed / holdDuration, 1);
    setProgress(p);
    if (p < 1) {
      if (chargeSound) updateHoldCharge(p);
      raf.current = requestAnimationFrame(animate);
    } else {
      if (chargeSound) stopHoldCharge();
      onClick();
      holding.current = false;
      setProgress(0);
    }
  }, [holdDuration, onClick, chargeSound]);

  const onDown = useCallback(() => {
    holding.current = true;
    startTime.current = Date.now();
    if (chargeSound) {
      startHoldCharge();
    } else {
      playClick();
    }
    raf.current = requestAnimationFrame(animate);
  }, [animate, chargeSound]);

  const onUp = useCallback(() => {
    holding.current = false;
    if (raf.current) cancelAnimationFrame(raf.current);
    if (chargeSound) stopHoldCharge();
    setProgress(0);
  }, [chargeSound]);

  useEffect(() => () => raf.current && cancelAnimationFrame(raf.current), []);

  return (
    <button
      onClick={hold ? undefined : () => { playClick(); onClick(); }}
      onPointerDown={hold ? onDown : undefined}
      onPointerUp={hold ? onUp : undefined}
      onPointerLeave={hold ? onUp : undefined}
      onPointerCancel={hold ? onUp : undefined}
      onContextMenu={(e) => e.preventDefault()}
      className={`
        relative overflow-hidden border transition-all duration-100
        cursor-pointer touch-manipulation
        bg-ed-panel/60 ${c.border} ${c.borderHover}
        active:scale-95 active:brightness-75
        ${wide
          ? "flex items-center justify-between gap-[var(--space-sm)] p-[2.5vw]"
          : small
            ? "flex flex-col items-center justify-center w-[var(--btn-sm)] h-[var(--btn-sm)]"
            : "flex flex-col items-center justify-center w-[var(--btn)] h-[var(--btn)]"
        }
        ${className}
      `}
    >
      {!wide && !small && pips === undefined && (
        <span className={`absolute top-[var(--space-md)] left-1/2 -translate-x-1/2 w-[80%] h-[var(--space-sm)] transition-all duration-200 ${
          active ? `${c.bar} ${c.barShadow}` : c.barDim
        }`} />
      )}

      {!wide && !small && pips !== undefined && (
        <div className="flex gap-[var(--pip-gap)] absolute top-[var(--space-md)] left-1/2 -translate-x-1/2 w-[76%]">
          {Array.from({ length: maxPips }, (_, i) => (
            <span key={i} className={`h-[var(--pip-h)] flex-1 transition-all duration-200 ${
              i < pips
                ? `${c.bar} ${c.pipShadow}`
                : c.pipDim
            }`} />
          ))}
        </div>
      )}

      {Icon && (
        <span className={`${small ? "icon-sm" : "icon-md"} ${!wide && !small ? "mt-[calc(var(--space-md)+var(--space-sm)+0.2vw)]" : ""} ${isToggle ? (active ? c.text : c.textDim) : c.text}`}>
          <Icon style={{ width: "100%", height: "100%" }} />
        </span>
      )}

      <span className={`px-1 uppercase tracking-wider font-semibold leading-tight ${c.text} ${
        wide ? "text-[var(--text-sm)]" : small ? "text-[var(--text-xs)]" : "text-[var(--text-sm)]"
      }`}>
        {label}
      </span>

      {hold && (
        <span
          className={`absolute bottom-0 left-0 h-[var(--space-xs)] ${c.bar} transition-none`}
          style={{ width: `${progress * 100}%` }}
        />
      )}
    </button>
  );
}
