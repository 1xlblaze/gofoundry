import type { Metadata } from "next";
import Link from "next/link";
import { WaitlistForm } from "@/components/WaitlistForm";
import { cheatSheets } from "@/content/cheatsheets";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = {
  title: "Go Engineering Cheat Sheets",
  description:
    "Printable Go concurrency and GMP scheduler references for code reviews, incident response, and technical interviews.",
};

export default function CheatSheetsPage() {
  return (
    <main className="shell sheetdoc-page magnet-print-root">
      <header className="page-hero sheetdoc-hero">
        <span className="kicker">Print-ready references</span>
        <h1>Go cheat sheets</h1>
        <p>
          Compact review prompts for concurrency correctness and scheduler
          reasoning. Keep them beside your editor or take them into interview prep.
        </p>
      </header>

      <section className="panel magnet-panel magnet-no-print" aria-labelledby="magnet-title">
        <div className="magnet-copy">
          <p className="type-label">Free staff-level review pack</p>
          <h2 id="magnet-title" className="type-title">
            Keep the field guides within reach
          </h2>
          <p>
            Join the list for new printable Go references, then save this
            collection as a clean PDF today.
          </p>
        </div>
        <div className="magnet-actions">
          <WaitlistForm
            tier="cheatsheet"
            source="cheatsheet-pdf"
            buttonLabel="Send me new sheets"
          />
          <PrintButton />
          <p className="magnet-print-instructions">
            Your browser&apos;s print dialog can save the two field guides as a PDF.
          </p>
        </div>
      </section>

      <section
        className="panel sheetdoc-directory magnet-no-print"
        aria-labelledby="sheetdoc-directory-title"
      >
        <div>
          <p className="type-label">In this collection</p>
          <h2 id="sheetdoc-directory-title" className="type-title">
            Two field guides
          </h2>
        </div>
        <nav className="sheetdoc-directory-links" aria-label="Cheat sheets">
          {cheatSheets.map((sheet) => (
            <a key={sheet.slug} href={`#${sheet.slug}`} className="chip chip-brand">
              {sheet.title}
            </a>
          ))}
        </nav>
        <p className="sheetdoc-print-note">
          Print / Save as PDF from browser
        </p>
      </section>

      <div className="sheetdoc-list">
        {cheatSheets.map((sheet, index) => (
          <article key={sheet.slug} id={sheet.slug} className="panel sheetdoc-sheet">
            <header className="sheetdoc-sheet-header">
              <span className="sheetdoc-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="type-label">GoFoundry field guide</p>
                <h2 className="type-title">{sheet.title}</h2>
                <p>{sheet.description}</p>
              </div>
            </header>

            <div className="sheetdoc-sections">
              {sheet.sections.map((section) => (
                <section key={section.heading} className="sheetdoc-section">
                  <h3>{section.heading}</h3>
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </article>
        ))}
      </div>

      <aside className="panel sheetdoc-cta" aria-labelledby="sheetdoc-cta-title">
        <div>
          <p className="type-label">See the scheduler move</p>
          <h2 id="sheetdoc-cta-title" className="type-title">
            Continue in the visual lab
          </h2>
          <p>
            Turn the G/M/P reference into a working mental model with the
            interactive scheduler visualizer.
          </p>
        </div>
        <Link href="/lab" className="primary-btn">
          Open the visualizer
        </Link>
      </aside>
    </main>
  );
}
