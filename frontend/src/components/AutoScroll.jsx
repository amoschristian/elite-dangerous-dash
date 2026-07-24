export function AutoScroll({ children, className = "" }) {
  return (
    <span className={`block overflow-hidden whitespace-nowrap ${className}`}>
      <span className="marquee-animate inline-flex" style={{ animationDuration: `${Math.max(6, String(children).length * 0.5)}s` }}>
        <span>{children}</span>
        <span>{children}</span>
      </span>
    </span>
  );
}
