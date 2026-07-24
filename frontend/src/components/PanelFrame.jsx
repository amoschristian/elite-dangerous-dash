import { motion } from "motion/react";

const variantColors = {
  default: { border: "border-ed-holo-dim/30", corner: "var(--color-ed-holo-dim)" },
  danger: { border: "border-ed-danger/50", corner: "var(--color-ed-danger)" },
  accent: { border: "border-ed-accent/50", corner: "var(--color-ed-accent)" },
};

export function PanelFrame({ title, className = "", children, variant = "default", isCombat = false }) {
  const v = variantColors[variant] || variantColors.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`panel-frame relative bg-ed-panel/80 backdrop-blur-sm p-[var(--space-lg)] ${isCombat ? "border-ed-danger/70 combat-blink" : v.border} ${className}`}
      style={{ "--corner-color": v.corner }}
    >
      {title && (
        <div className="text-ed-holo-dim text-[var(--text-xs)] uppercase tracking-[0.15em] font-semibold mb-[var(--space-sm)]">
          {title}
        </div>
      )}

      {children}
    </motion.div>
  );
}
