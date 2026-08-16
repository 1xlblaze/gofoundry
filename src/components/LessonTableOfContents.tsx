"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { LessonSection } from "@/lib/lesson-sections";

type ToneFilter = "all" | LessonSection["tone"];

const toneLabels: Record<LessonSection["tone"], string> = {
  neutral: "Read",
  think: "Think",
  action: "Code",
  visual: "Diagram",
};

function LessonSectionMobile({ sections }: { sections: LessonSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toneFilter, setToneFilter] = useState<ToneFilter>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

  useEffect(() => {
    if (!sheetOpen) return;
    document.body.classList.add("lesson-section-sheet-open");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("lesson-section-sheet-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  const filteredSections = useMemo(
    () =>
      toneFilter === "all"
        ? sections
        : sections.filter((section) => section.tone === toneFilter),
    [sections, toneFilter],
  );

  const activeSection = sections.find((section) => section.id === activeId) ?? sections[0];
  const activeIndex = activeSection ? activeSection.index + 1 : 1;
  const progressPct = Math.round((activeIndex / sections.length) * 100);
  const toneFilters: ToneFilter[] = ["all", "neutral", "think", "action", "visual"];

  if (!mounted) return null;

  const mobile = (
    <div className="lesson-section-mobile" aria-label="Section navigation">
      <div className="lesson-section-bar">
        <div className="lesson-section-bar-progress" aria-hidden>
          <span style={{ width: `${progressPct}%` }} />
        </div>
        <div className="lesson-section-bar-inner">
          <button
            type="button"
            className="lesson-section-bar-trigger"
            aria-expanded={sheetOpen}
            onClick={() => setSheetOpen(true)}
          >
            <span className="lesson-section-bar-index">
              {String(activeIndex).padStart(2, "0")}/{String(sections.length).padStart(2, "0")}
            </span>
            <span className="lesson-section-bar-title">{activeSection?.label}</span>
          </button>
          <div className="lesson-section-rail" role="list" aria-label="Section quick jump">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                role="listitem"
                className={`lesson-section-dot lesson-section-dot-${section.tone}${
                  activeId === section.id ? " is-active" : ""
                }`}
                aria-label={`Section ${section.index + 1}: ${section.label}`}
                aria-current={activeId === section.id ? "true" : undefined}
              >
                {section.index + 1}
              </a>
            ))}
          </div>
        </div>
      </div>

      {sheetOpen ? (
        <>
          <button
            type="button"
            className="lesson-section-sheet-backdrop"
            aria-label="Close section list"
            onClick={() => setSheetOpen(false)}
          />
          <div
            className="lesson-section-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="All lesson sections"
          >
            <header className="lesson-section-sheet-head">
              <div>
                <p className="type-label">Jump to section</p>
                <h2 className="lesson-section-sheet-title">{sections.length} sections</h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="Close"
                onClick={() => setSheetOpen(false)}
              >
                ✕
              </button>
            </header>

            <div className="lesson-tone-filters" role="group" aria-label="Filter by section type">
              {toneFilters.map((tone) => {
                const count =
                  tone === "all"
                    ? sections.length
                    : sections.filter((s) => s.tone === tone).length;
                if (tone !== "all" && count === 0) return null;
                return (
                  <button
                    key={tone}
                    type="button"
                    className={`lesson-tone-filter${toneFilter === tone ? " is-active" : ""}`}
                    onClick={() => setToneFilter(tone)}
                  >
                    {tone === "all" ? "All" : toneLabels[tone]}
                    <span className="lesson-tone-filter-count">{count}</span>
                  </button>
                );
              })}
            </div>

            <ol className="lesson-section-sheet-list">
              {filteredSections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className={`lesson-toc-link lesson-toc-${section.tone}${
                      activeId === section.id ? " is-active" : ""
                    }`}
                    onClick={() => setSheetOpen(false)}
                  >
                    <span className="lesson-toc-index">
                      {String(section.index + 1).padStart(2, "0")}
                    </span>
                    <span className="lesson-section-sheet-label">
                      <span className="lesson-section-sheet-tone">{toneLabels[section.tone]}</span>
                      {section.label}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </>
      ) : null}
    </div>
  );

  return createPortal(mobile, document.body);
}

export function LessonTableOfContents({
  sections,
  activeId: activeIdProp,
}: {
  sections: LessonSection[];
  activeId?: string;
}) {
  const [activeId, setActiveId] = useState(activeIdProp ?? sections[0]?.id ?? "");

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

  return (
    <>
      <nav className="lesson-toc lesson-toc-desktop-only" aria-label="Lesson sections">
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
      <LessonSectionMobile sections={sections} />
    </>
  );
}
