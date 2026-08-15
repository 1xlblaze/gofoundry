"use client";

import { useEffect, useState } from "react";
import type { LessonSection } from "@/lib/lesson-sections";

export function LessonTableOfContents({ sections }: { sections: LessonSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);

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
      { rootMargin: "-18% 0px -58% 0px", threshold: 0.01 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length < 4) return null;

  const activeSection = sections.find((section) => section.id === activeId) ?? sections[0];
  const activeIndex = activeSection ? activeSection.index + 1 : 1;

  return (
    <nav className="lesson-toc" aria-label="Lesson sections">
      <div className="lesson-toc-mobile">
        <button
          type="button"
          className="lesson-toc-toggle"
          aria-expanded={mobileOpen}
          aria-controls="lesson-toc-panel"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span className="lesson-toc-toggle-label">
            <span className="type-label">Section {activeIndex} of {sections.length}</span>
            <span className="lesson-toc-toggle-title">{activeSection?.label}</span>
          </span>
          <span className="lesson-toc-toggle-icon" aria-hidden>{mobileOpen ? "▲" : "▼"}</span>
        </button>

        <ol
          id="lesson-toc-panel"
          className={`lesson-toc-list lesson-toc-list-mobile${mobileOpen ? " is-open" : ""}`}
        >
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={`lesson-toc-link lesson-toc-${section.tone}${
                  activeId === section.id ? " is-active" : ""
                }`}
                aria-current={activeId === section.id ? "true" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <span className="lesson-toc-index">
                  {String(section.index + 1).padStart(2, "0")}
                </span>
                <span>{section.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>

      <div className="lesson-toc-desktop">
        <p className="lesson-toc-label type-label">On this page</p>
        <ol className="lesson-toc-list lesson-toc-list-desktop">
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
      </div>
    </nav>
  );
}
