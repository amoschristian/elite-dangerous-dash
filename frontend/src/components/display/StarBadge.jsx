const STAR_COLORS = {
  O: { bg: "rgba(150,180,255,0.2)", border: "rgba(150,180,255,0.5)", text: "#b8ccff" },
  B: { bg: "rgba(170,200,255,0.2)", border: "rgba(170,200,255,0.5)", text: "#c8ddff" },
  A: { bg: "rgba(210,230,255,0.2)", border: "rgba(210,230,255,0.5)", text: "#e0f0ff" },
  F: { bg: "rgba(255,240,200,0.2)", border: "rgba(255,240,200,0.5)", text: "#fff8d0" },
  G: { bg: "rgba(255,220,140,0.2)", border: "rgba(255,220,140,0.5)", text: "#ffe090" },
  K: { bg: "rgba(255,160,60,0.2)",  border: "rgba(255,160,60,0.5)",  text: "#ffB048" },
  M: { bg: "rgba(255,100,40,0.2)",  border: "rgba(255,100,40,0.5)",  text: "#ff7030" },
};

const FALLBACK = { bg: "rgba(122,63,24,0.2)", border: "rgba(122,63,24,0.5)", text: "#7a3f18" };

export function StarBadge({ starClass }) {
  if (!starClass) return null;

  const colors = STAR_COLORS[starClass] ?? FALLBACK;

  return (
    <span
      className="inline-block ml-[var(--space-sm)] px-[var(--space-sm)] text-[var(--text-xs)] font-bold font-ed-mono tracking-wider align-middle"
      style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
      }}
    >
      {starClass}
    </span>
  );
}
