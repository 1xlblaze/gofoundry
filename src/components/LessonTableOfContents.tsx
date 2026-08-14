"use client";

import { useEffect, useState } from "react";
import type { LessonSection } from "@/lib/lesson-sections";

export function LessonTableOfContents({ sections }: { sections: LessonSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    if (sections.length === 0) return;

    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => node !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: 0.01 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length < 4) return null;

  return (
    <nav className="lesson-toc" aria-label="Lesson sections">
      <p className="lesson-toc-label type-label">On this page</p>
      <ol className="lesson-toc-list">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={`lesson-toc-link lesson-toc-${section.tone}${
                activeId === section.id ? " is-active" : ""
              }`}
              aria-current={activeId === section.id ? "true" : undefined}
            >
              <span className="lesson-toc-index">
                {String(section.index + 1).padStart(2, "0")}
              </span>
              <span>{section.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
