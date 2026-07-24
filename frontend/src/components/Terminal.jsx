import { useState, useEffect, useRef, useCallback } from "preact/hooks";

const TYPE_SPEED = 25;

export function Terminal({ apiRef, prompt = "> ", className = "" }) {
  const [typedLines, setTypedLines] = useState([]);
  const [currentText, setCurrentText] = useState("");
  const [cursor, setCursor] = useState(true);
  const queueRef = useRef([]);
  const typingRef = useRef(false);
  const containerRef = useRef(null);

  // Blinking cursor
  useEffect(() => {
    const id = setInterval(() => setCursor(c => !c), 530);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [typedLines, currentText]);

  const processQueue = useCallback(() => {
    if (typingRef.current) return;
    if (queueRef.current.length === 0) return;

    typingRef.current = true;
    const line = queueRef.current.shift();
    let charIndex = 0;

    const type = () => {
      if (charIndex < line.length) {
        setCurrentText(line.slice(0, charIndex + 1));
        charIndex++;
        setTimeout(type, TYPE_SPEED);
      } else {
        setTypedLines(prev => [...prev, line]);
        setCurrentText("");
        typingRef.current = false;
        setTimeout(() => processQueue(), 50);
      }
    };

    type();
  }, []);

  const addLine = useCallback((text) => {
    queueRef.current.push(text);
    processQueue();
  }, [processQueue]);

  const addLines = useCallback((texts) => {
    queueRef.current.push(...texts);
    processQueue();
  }, [processQueue]);

  const clear = useCallback(() => {
    queueRef.current = [];
    setTypedLines([]);
    setCurrentText("");
    typingRef.current = false;
  }, []);

  // Expose imperative API via ref
  useEffect(() => {
    if (apiRef) {
      apiRef.current = { addLine, addLines, clear };
    }
  }, [apiRef, addLine, addLines, clear]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-y-auto hide-scrollbar font-ed-mono text-[var(--text-sm)] leading-relaxed p-[var(--space-md)] ${className}`}
    >
      {typedLines.map((line, i) => (
        <div key={i} className="text-ed-holo-dim/70 whitespace-pre-wrap">
          <span className="text-ed-holo-dim/40">{prompt}</span>
          {line}
        </div>
      ))}

      {(currentText || queueRef.current.length > 0 || typedLines.length === 0) && (
        <div className="text-ed-holo whitespace-pre-wrap">
          <span className="text-ed-holo-dim/60">{prompt}</span>
          {currentText || "\u200B"}
          <span className={`${cursor ? "opacity-100" : "opacity-0"} transition-opacity`}>█</span>
        </div>
      )}
    </div>
  );
}
