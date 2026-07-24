import { useState } from "preact/hooks";
import { useSpanshBody, formatCredits } from "../../hooks/useSpansh.js";
import { BounceScroll } from "../BounceScroll.jsx";

/* ── SVG Approach Gauge ───────────────────────────────── */
function ApproachGauge({ altitude, maxAlt }) {
  const ratio = Math.min(Math.max(altitude / maxAlt, 0), 1);
  const cx = 110, baseY = 175;
  const planetR = 60, cruiseR = 105, outerR = 150;
  const shipFar = baseY - outerR;
  const shipNear = baseY - planetR;
  const shipY = shipFar + (1 - ratio) * (shipNear - shipFar);
  const shipX = cx;

  const semicircle = (r) => `M ${cx - r} ${baseY} A ${r} ${r} 0 0 1 ${cx + r} ${baseY}`;

  return (
    <svg viewBox="0 0 220 200" className="w-full max-w-[240px]">
      <path d={semicircle(outerR)} fill="none"
        stroke="var(--color-ed-holo)" stroke-width="0.8" stroke-dasharray="5 8" opacity="0.4" />
      <path d={semicircle(cruiseR)} fill="none"
        stroke="var(--color-ed-holo)" stroke-width="0.7" stroke-dasharray="3 6" opacity="0.35" />
      <path d={`${semicircle(planetR)} Z`}
        fill="var(--color-ed-holo)" opacity="0.08"
        stroke="var(--color-ed-holo)" stroke-width="1" />

      <line x1={shipX + 18} y1={shipY} x2={shipX + 18} y2={baseY - planetR}
        stroke="var(--color-ed-holo)" stroke-width="0.6" opacity="0.3" />
      <line x1={shipX + 15} y1={shipY} x2={shipX + 21} y2={shipY}
        stroke="var(--color-ed-holo)" stroke-width="0.6" opacity="0.35" />
      <line x1={shipX + 15} y1={baseY - planetR} x2={shipX + 21} y2={baseY - planetR}
        stroke="var(--color-ed-holo)" stroke-width="0.6" opacity="0.35" />

      <text x={shipX + 25} y={(shipY + (baseY - planetR)) / 2 + 4}
        fill="var(--color-ed-holo)" font-size="10" font-family="monospace" opacity="0.55">
        {altitude.toLocaleString()} m
      </text>

      <polygon
        points={`${shipX - 7},${shipY - 5} ${shipX + 7},${shipY - 5} ${shipX},${shipY + 8}`}
        fill="var(--color-ed-accent)" stroke="var(--color-ed-holo)" stroke-width="1"
        className="animate-pulse"
      />
    </svg>
  );
}

/* ── Planet info rows ────────────────────────────────── */
function PlanetInfo({ data, loading, error }) {
  if (loading) {
    return (
      <div className="text-[var(--text-xs)] uppercase tracking-widest text-ed-holo-dim/60 animate-pulse mt-[var(--space-xs)]">
        Loading planet info…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-[var(--text-xs)] uppercase tracking-widest text-ed-holo-dim/40 mt-[var(--space-xs)]">
        No planet data
      </div>
    );
  }

  if (!data) return null;

  const s = data;

  return (
    <>
      <div>
        <span className="text-[var(--text-xs)] uppercase tracking-widest text-ed-holo/80">Type</span>
        <div className="text-[var(--text-sm)] font-bold tracking-wider text-ed-holo">
          {s.body_type || "—"}
        </div>
      </div>

      {s.gravity != null && (
        <div>
          <span className="text-[var(--text-xs)] uppercase tracking-widest text-ed-holo/80">Gravity</span>
          <div className="text-[var(--text-sm)] font-bold font-ed-mono text-ed-holo">
            {s.gravity.toFixed(2)} G
          </div>
        </div>
      )}

      {s.atmosphere && (
        <div>
          <span className="text-[var(--text-xs)] uppercase tracking-widest text-ed-holo/80">Atmosphere</span>
          <div className="text-[var(--text-sm)] font-bold tracking-wider text-ed-holo">
            {s.atmosphere}
          </div>
        </div>
      )}

      {s.volcanism && (
        <div>
          <span className="text-[var(--text-xs)] uppercase tracking-widest text-ed-holo/80">Volcanism</span>
          <div className="text-[var(--text-sm)] font-bold tracking-wider text-ed-holo">
            {s.volcanism}
          </div>
        </div>
      )}

      {(s.bio_signals > 0 || s.geo_signals > 0) && (
        <div>
          <span className="text-[var(--text-xs)] uppercase tracking-widest text-ed-holo/80">Signals</span>
          <div className="text-[var(--text-sm)] font-bold font-ed-mono text-ed-holo">
            {s.bio_signals > 0 && `${s.bio_signals} bio`}
            {s.bio_signals > 0 && s.geo_signals > 0 && " · "}
            {s.geo_signals > 0 && `${s.geo_signals} geo`}
          </div>
        </div>
      )}

      {s.materials.length > 0 && (
        <div>
          <span className="text-[var(--text-xs)] uppercase tracking-widest text-ed-holo/80">Materials</span>
          <div className="text-[var(--text-sm)] font-bold tracking-wider text-ed-holo">
            {s.materials.join(" · ")}
          </div>
        </div>
      )}

      {s.landmark_value > 0 && (
        <div>
          <span className="text-[var(--text-xs)] uppercase tracking-widest text-ed-holo/80">Value</span>
          <div className="text-[var(--text-sm)] font-bold font-ed-mono text-ed-accent">
            {formatCredits(s.landmark_value)}
          </div>
        </div>
      )}
    </>
  );
}

/* ── Exported component ───────────────────────────────── */
export function ApproachBody({ ctxData, hideTitle }) {
  const body = ctxData?.body || "Unknown";
  const altitude = ctxData?.altitude ?? 0;
  const radius = ctxData?.planet_radius ?? 1;
  const systemAddress = ctxData?.system_address ?? 0;
  const bodyId = ctxData?.body_id ?? 0;

  const { data, loading, error } = useSpanshBody(systemAddress, bodyId);
  const [maxAlt] = useState(() => Math.max(altitude, radius * 0.1));

  return (
    <div>
      {!hideTitle && (
        <div className="text-[calc(var(--text-xl)*1.6)] font-bold tracking-wider text-ed-holo mb-[var(--space-md)]">
          {body}
        </div>
      )}

      <div className="flex gap-[var(--space-lg)] items-start">
        <BounceScroll className="w-[30%] max-h-[220px] overflow-hidden">
          <div className="flex flex-col gap-[var(--space-sm)]">
            <PlanetInfo data={data} loading={loading} error={error} />
          </div>
        </BounceScroll>

        <div className="w-[70%] flex items-center justify-center">
          <ApproachGauge altitude={altitude} maxAlt={maxAlt} />
        </div>
      </div>
    </div>
  );
}
