"use client";

import { useEffect, useRef } from "react";

export function ReadingProgress({ articleId }: { articleId: string }) {
  const fillRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const article = document.getElementById(articleId);
    const fill = fillRef.current;
    const track = trackRef.current;
    if (!article || !fill || !track) return;

    let frame: number | null = null;

    const update = () => {
      frame = null;
      const articleTop = article.getBoundingClientRect().top + window.scrollY;
      const articleBottom = articleTop + article.offsetHeight;
      const readableDistance = Math.max(articleBottom - window.innerHeight - articleTop, 1);
      const value = Math.min(
        1,
        Math.max(0, (window.scrollY - articleTop) / readableDistance),
      );

      fill.style.transform = `scaleX(${value})`;
      track.setAttribute("aria-valuenow", String(Math.round(value * 100)));
    };

    const requestUpdate = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [articleId]);

  return (
    <div
      ref={trackRef}
      className="readbar-track"
      role="progressbar"
      aria-label="Lesson reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      <span ref={fillRef} className="readbar-fill" />
    </div>
  );
}
