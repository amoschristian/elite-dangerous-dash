import { useState, useEffect } from "preact/hooks";

const API = "http://127.0.0.1:8000/api/spansh";

/* ── Shared Spansh fetch logic ───────────────────────── */

export function useSpanshBody(systemAddress, bodyId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!systemAddress || !bodyId) return;

    let cancelled = false;
    setLoading(true);
    setData(null);
    setError(false);

    const id64 = (BigInt(bodyId) << 55n) + BigInt(systemAddress);

    fetch(`${API}/body/${id64}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        const rec = json.record;
        if (!rec) throw new Error("No record");
        setData(extractBody(rec));
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("Spansh body fetch failed:", err);
          setLoading(false);
          setError(true);
        }
      });

    return () => { cancelled = true; };
  }, [systemAddress, bodyId]);

  return { data, loading, error };
}

export function useSpanshSystem(systemAddress) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!systemAddress) return;

    let cancelled = false;
    setLoading(true);
    setData(null);
    setError(false);

    fetch(`${API}/system/${systemAddress}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        const rec = json.record;
        if (!rec) throw new Error("No record");
        setData(extractSystem(rec));
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("Spansh system fetch failed:", err);
          setLoading(false);
          setError(true);
        }
      });

    return () => { cancelled = true; };
  }, [systemAddress]);

  return { data, loading, error };
}

/* ── Extractors ──────────────────────────────────────── */

function extractBody(rec) {
  const isStar = rec.type === "Star";

  let bio = 0, geo = 0;
  for (const s of rec.signals || []) {
    if (s.name === "Biological") bio = s.count;
    if (s.name === "Geological") geo = s.count;
  }

  const mats = (rec.materials || [])
    .sort((a, b) => (b.share || 0) - (a.share || 0))
    .slice(0, 4)
    .map((m) => m.name || "");

  return {
    kind: "body",
    body_type: isStar ? "Star" : (rec.subtype || ""),
    gravity: rec.gravity,
    landable: rec.is_landable,
    atmosphere: rec.atmosphere || "",
    volcanism: rec.volcanism_type === "No volcanism" ? "" : (rec.volcanism_type || ""),
    surface_temp: rec.surface_temperature,
    bio_signals: bio,
    geo_signals: geo,
    materials: mats,
    landmark_value: rec.landmark_value || 0,
  };
}

function extractSystem(rec) {
  return {
    kind: "system",
    name: rec.name || "",
    allegiance: rec.allegiance || "",
    government: rec.government || "",
    economy: rec.primary_economy || "",
    security: rec.security || "",
    population: rec.population || 0,
    body_count: rec.body_count || 0,
    station_count: (rec.stations || []).length,
    faction: rec.controlling_minor_faction || "",
    faction_state: rec.controlling_minor_faction_state || "",
  };
}

/* ── Helpers ─────────────────────────────────────────── */

export function formatCredits(v) {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + "B Cr";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M Cr";
  if (v >= 1_000) return (v / 1_000).toFixed(0) + "K Cr";
  return v.toLocaleString() + " Cr";
}

export function formatPopulation(n) {
  if (!n) return "";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

const SECURITY_COLOR = {
  "Anarchy": "text-ed-danger",
  "Low Security": "text-ed-warning",
  "Medium Security": "text-ed-holo",
  "High Security": "text-ed-green",
};

export function securityColor(sec) {
  return SECURITY_COLOR[sec] ?? "text-ed-holo";
}
