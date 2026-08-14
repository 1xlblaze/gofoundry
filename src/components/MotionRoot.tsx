"use client";

import { useEffect, useRef, type ReactNode } from "react";

function revealAll(nodes: NodeListOf<HTMLElement>) {
  nodes.forEach((el) => el.classList.add("is-visible"));
}

export function MotionRoot({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const nodes = root.querySelectorAll<HTMLElement>("[data-motion]");
    if (nodes.length === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      revealAll(nodes);
      return;
    }

    const reveal = (el: Element) => {
      el.classList.add("is-visible");
      io.unobserve(el);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) reveal(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px 0px 0px" },
    );

    nodes.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const inView =
        rect.top < window.innerHeight * 0.92 && rect.bottom > window.innerHeight * 0.08;
      if (inView) {
        el.classList.add("is-visible");
        return;
      }
      io.observe(el);
    });

    const fallback = window.setTimeout(() => revealAll(nodes), 1800);

    return () => {
      window.clearTimeout(fallback);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="motion-root">
      {children}
    </div>
  );
}
