"use client";

import { CollapsibleSection } from "@/components/ui";
import type { CheatSheet } from "@/content/cheatsheets";

export function CheatsheetSections({ sheet }: { sheet: CheatSheet }) {
  return (
    <div className="sheetdoc-sections">
      {sheet.sections.map((section, index) => (
        <CollapsibleSection
          key={section.heading}
          title={section.heading}
          summary={`${section.bullets.length} points`}
          defaultOpen={index === 0}
        >
          <ul>
            {section.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </CollapsibleSection>
      ))}
    </div>
  );
}
