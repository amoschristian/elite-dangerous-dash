export function Marquee({ items, speed = 20 }) {
  if (!items || items.length === 0) return null;

  const duplicated = [...items, ...items];

  return (
    <div className="w-full h-full overflow-hidden flex items-center">
      <div
        className="marquee-animate flex whitespace-nowrap" style={{ gap: '5vw', animationDuration: `${speed}s` }}
      >
        {duplicated.map((item, i) => (
          <span key={i} className="text-ed-holo font-semibold tracking-wider glow-text" style={{ fontSize: 'var(--text-xl)' }}>
            ---- {item} -----
          </span>
        ))}
      </div>
    </div>
  );
}
