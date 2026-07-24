import { Rocket, Globe } from "lucide-preact";
import { Button } from "./Button.jsx";

const keypress = (action) => {
  fetch(`http://127.0.0.1:8000/action?action=${action}`, { method: "GET" });
};

export function FsdButton({ mode, data, className = "" }) {
  const flags = data?.status?.Flags ?? {};

  const isMassLocked = flags.is_fsd_mass_locked;
  const isCharging = flags.is_fsd_charging;
  const isCooldown = flags.is_fsd_cooldown;
  const isSupercruise = flags.is_supercruise;
  const isJumping = flags.is_fsd_jumping;

  const blocked = isMassLocked || isCharging || isCooldown;

  if (mode === "supercruise") {
    return (
      <Button
        label={isMassLocked ? "Locked" : isCooldown ? "Cool" : "SC"}
        icon={Globe}
        onClick={blocked ? undefined : () => keypress("fsd")}
        hold={!blocked}
        wide
        green
        chargeSound={!blocked}
        active={!blocked}
        className={className}
      />
    );
  }

  if (mode === "hypercruise") {
    return (
      <Button
        label={isMassLocked ? "Locked" : isCooldown ? "Cool" : "HC"}
        icon={Rocket}
        onClick={blocked ? undefined : () => keypress("fsd")}
        hold={!blocked}
        wide
        green
        chargeSound={!blocked}
        active={!blocked}
        className={className}
      />
    );
  }

  return null;
}
