export function Docking({ ctxData, gearDown, lightsOn, hideTitle }) {
  return (
    <div>
      {!hideTitle && (
        <div className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-accent">
          DOCKING — PROCEED TO PAD {ctxData?.landing_pad || "--"}
        </div>
      )}
      <div className="flex flex-col gap-[var(--space-sm)] mt-[var(--space-md)]">
        <div className="text-ed-holo text-[var(--text-xs)] uppercase tracking-widest">
          CHECKLIST
        </div>
        {[
          { label: "LANDING GEAR", status: gearDown ? "DEPLOYED" : "UP" },
          { label: "LIGHTS", status: lightsOn ? "ON" : "OFF" },
          { label: "SPEED", status: "ADJUST" },
        ].map((item, i) => (
          <div
            key={i}
            className={`text-[var(--text-sm)] flex items-center ${
              (item.label === "LANDING GEAR" && !gearDown) || (item.label === "LIGHTS" && !lightsOn)
                ? "text-ed-accent animate-pulse"
                : "text-ed-holo"
            }`}
          >
            <span className="uppercase tracking-wider">{item.label}</span>
            <span className="flex-1 mx-[var(--space-sm)] border-b border-dotted border-ed-holo-dim/40" />
            <span className={`font-semibold ${
              item.status === "DEPLOYED" || item.status === "ON" ? "text-ed-accent" :
              item.status === "UP" || item.status === "OFF" ? "text-ed-danger" : "text-ed-holo"
            }`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
