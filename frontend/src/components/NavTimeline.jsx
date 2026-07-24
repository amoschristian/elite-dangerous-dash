import { AutoScroll } from "./AutoScroll.jsx";

const MAX_ROUTE_ITEMS = 10;

function dotStyle(scoopable) {
  return {
    width: 'var(--space-md)',
    height: 'var(--space-md)',
    backgroundColor: scoopable ? 'var(--color-ed-accent)' : 'transparent',
    borderColor: scoopable ? 'var(--color-ed-accent)' : 'var(--color-ed-holo-dim)',
    opacity: scoopable ? 0.4 : 1,
  };
}

export function NavTimeline({ navroute = [] }) {
  if (navroute.length === 0) return null;

  const nextRoute = navroute[0];
  const intermediateRoutes = navroute.slice(1, -1);
  const targetRoute = navroute.at(-1);
  const jumpsCount = navroute.length;
  const hiddenCount = intermediateRoutes.length - MAX_ROUTE_ITEMS;

  const Row = ({ route, className, dotClass, dotStyle: ds }) => (
    <div className={`flex items-center gap-[var(--space-md)] ${className}`}>
      <div className="flex items-center justify-center shrink-0" style={{ width: 'var(--space-md)', height: 'var(--space-md)' }}>
        <div className={`border ${dotClass}`} style={{ width: 'var(--space-md)', height: 'var(--space-md)', ...ds }} />
      </div>
      <div className="flex items-center flex-1 min-w-0 gap-[var(--space-xs)]">
        <span
          className="shrink-0 whitespace-nowrap text-right text-ed-holo-dim font-ed-mono inline-block"
          style={{ fontSize: '1.25vw', width: '5.5vw' }}
        >
          {route.distance.toFixed(1)} LY
        </span>
        <AutoScroll key={route.name} className="flex-1 min-w-0 text-[var(--text-md)] tracking-wider font-medium">{route.name}</AutoScroll>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-[var(--space-md)]">
      <div>
        <div className="text-[var(--text-xs)] uppercase tracking-widest font-semibold text-ed-holo-dim">
          Next Destination
        </div>
        <Row
          route={nextRoute}
          className="py-[var(--space-xs)] border border-ed-accent/40 bg-ed-accent/4 pl-[var(--space-lg)]"
          dotClass="rounded-full"
          dotStyle={dotStyle(nextRoute.scoopable)}
        />
      </div>

      {intermediateRoutes.length > 0 && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="text-[var(--text-xs)] uppercase tracking-widest font-semibold text-ed-holo-dim">
            Route
          </div>
          <div className="relative flex-1 min-h-0 overflow-y-auto hide-scrollbar">
            <div
              className="absolute top-0 bottom-0 bg-ed-holo-dim/20"
              style={{
                left: 'calc(var(--space-lg) + var(--space-md) / 2)',
                width: 'var(--space-xs)',
                transform: 'translateX(-50%)',
              }}
            />
            {intermediateRoutes.slice(0, MAX_ROUTE_ITEMS).map((route, i) => (
              <Row
                key={route.name || i}
                route={route}
                className="pl-[var(--space-lg)]"
                dotClass="rounded-full z-10"
                dotStyle={dotStyle(route.scoopable)}
              />
            ))}
            {hiddenCount > 0 && (
              <div className="text-[var(--text-xs)] text-ed-holo-dim font-ed-mono pl-[var(--space-lg)] py-[var(--space-xs)]">
                +{hiddenCount} more
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="text-[var(--text-xs)] uppercase tracking-widest font-semibold text-ed-holo-dim">
          Target Destination
        </div>
        <Row
          route={targetRoute}
          className="py-[var(--space-xs)] border border-ed-holo/40 bg-ed-holo/4 pl-[var(--space-lg)]"
          dotClass="rotate-45 shrink-0"
          dotStyle={dotStyle(targetRoute.scoopable)}
        />
      </div>

      <div className="text-[var(--text-xs)] text-ed-holo-dim font-ed-mono">
        ETA: <span className="text-ed-holo font-bold">{jumpsCount}</span> jump{jumpsCount !== 1 ? "s" : ""} left
      </div>
    </div>
  );
}
