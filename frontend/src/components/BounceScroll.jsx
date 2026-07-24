import { useRef, useEffect, useState } from "preact/hooks";

export function BounceScroll({ children, className = "" }) {
  const containerRef = useRef(null);
  const animRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const overflow = el.scrollHeight - el.clientHeight;
    if (overflow < 16) return; // only bounce if there's meaningful overflow

    const maxScroll = overflow;
    let direction = 1; // 1 = scrolling down, -1 = scrolling up
    let position = 0;
    const speed = 16; // pixels per second
    const pauseTop = 2000; // ms pause at top
    const pauseBottom = 3000; // ms pause at bottom
    let pauseUntil = 0;
    let lastTime = null;

    const animate = (timestamp) => {
      if (lastTime === null) lastTime = timestamp;
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // cap delta
      lastTime = timestamp;

      if (hovered) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }

      if (pauseUntil > 0 && timestamp < pauseUntil) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }
      pauseUntil = 0;

      position += direction * speed * dt;

      if (direction === 1 && position >= maxScroll) {
        position = maxScroll;
        direction = -1;
        pauseUntil = timestamp + pauseBottom;
      } else if (direction === -1 && position <= 0) {
        position = 0;
        direction = 1;
        pauseUntil = timestamp + pauseTop;
      }

      el.scrollTop = Math.round(position);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [hovered]);

  return (
    <div
      ref={containerRef}
      className={`${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  );
}
