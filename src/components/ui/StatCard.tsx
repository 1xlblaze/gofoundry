"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export function StatCard({
  value,
  suffix = "",
  label,
  accent,
}: {
  value: number;
  suffix?: string;
  label: string;
  accent?: string;
}) {
  const [display, setDisplay] = useState(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) {
      setDisplay(value);
      return;
    }

    const duration = 700;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const style = accent
    ? ({ "--stat-accent": accent } as CSSProperties)
    : undefined;

  return (
    <div className="ds-stat-card" style={style}>
      <strong className="ds-stat-value">
        {display}
        {suffix}
      </strong>
      <span className="ds-stat-label">{label}</span>
    </div>
  );
}
