function formatPopulation(n) {
  if (!n) return "";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

const SECURITY_COLOR = {
  "Anarchy": "text-ed-danger",
  "Low Security": "text-ed-warning",
  "Medium Security": "text-ed-holo",
  "High Security": "text-ed-green",
};

export function Normal({ ctxData, hideTitle }) {
  const {
    system = "Unknown",
    allegiance = "",
    economy = "",
    secondEconomy = "",
    government = "",
    security = "",
    population = 0,
    controllingFaction = "",
    controllingFactionState = "",
    factions = [],
  } = ctxData ?? {};

  const economyText = secondEconomy
    ? `${economy} / ${secondEconomy}`
    : economy;

  const secColor = SECURITY_COLOR[security] ?? "text-ed-holo";

  return (
    <div>
      {!hideTitle && (
        <div className="pb-[var(--space-sm)]">
          <div className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-holo">
            {system}
            {security && (
              <span className={`ml-[var(--space-sm)] text-[var(--text-lg)] ${secColor}`}>
                — {security.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-[var(--space-xs)]">
        <div className="flex flex-wrap items-center gap-x-[var(--space-sm)] gap-y-[var(--space-xs)] mt-[var(--space-md)] text-[var(--text-md)] text-ed-holo">
          {government && (
            <span className="uppercase tracking-wider">{government}</span>
          )}
          {economyText && (
            <>
              {government && <span className="text-ed-holo-dim/50">·</span>}
              <span className="uppercase tracking-wider">{economyText}</span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-[var(--space-sm)] mt-[var(--space-sm)] text-[var(--text-md)] text-ed-holo">
          {population > 0 && (
            <span className="uppercase tracking-wider">POP {formatPopulation(population)}</span>
          )}
          {allegiance && (
            <>
              {population > 0 && <span className="text-ed-holo-dim/50">·</span>}
              <span className="uppercase tracking-wider">{allegiance}</span>
            </>
          )}
        </div>

        {factions.length > 0 && (
          <div className="mt-[var(--space-md)]">
            <div className="text-[var(--text-xs)] uppercase tracking-widest text-ed-holo/60 mb-[var(--space-sm)]">
              Factions
            </div>
            <div className="flex flex-col gap-[var(--space-xs)]">
              {factions.slice(0, 5).map((f, i) => (
                <div key={i} className="flex items-center gap-[var(--space-sm)] text-[var(--text-md)] text-ed-holo">
                  <span className="truncate">{f.name}</span>
                  <span className="shrink-0 font-ed-mono text-[var(--text-xs)] text-ed-holo/70">
                    {(f.influence * 100).toFixed(1)}%
                  </span>
                  {f.activeStates.length > 0 && (
                    <span className="shrink-0 text-[var(--text-xxs)] uppercase tracking-wider text-ed-accent/80">
                      {f.activeStates.join(" · ")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {controllingFaction && (
          <div className="text-[var(--text-md)] text-ed-holo mt-[var(--space-md)]">
            <span className="uppercase tracking-wider text-[var(--text-xs)] text-ed-holo/60">CONTROLLING</span>
            <br />
            <span>{controllingFaction}</span>
            {controllingFactionState && (
              <span className="text-ed-accent ml-[var(--space-sm)] text-[var(--text-xs)] uppercase tracking-wider">
                ({controllingFactionState})
              </span>
            )}
          </div>
        )}

        {!government && !economyText && !security && !allegiance && !controllingFaction && (
          <div className="text-ed-holo-dim/40 text-[var(--text-sm)] mt-[var(--space-md)] uppercase tracking-widest">
            No system data
          </div>
        )}
      </div>
    </div>
  );
}
