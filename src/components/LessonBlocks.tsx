import type { ContentBlock } from "@/content/types";
import { Diagram } from "@/components/Diagram";

export function LessonBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-10">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "prose":
            return (
              <div key={i} className="prose-block">
                {block.title && <h3>{block.title}</h3>}
                {block.body.split("\n\n").map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            );
          case "code":
            return (
              <div key={i} className="code-panel">
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
                  <span className="text-[0.7rem] font-medium tracking-[0.12em] text-[#99f6e4]/80 uppercase">
                    {block.title ?? "Example"}
                  </span>
                  <span className="font-mono text-[0.65rem] tracking-wide text-white/35">
                    {block.language}
                  </span>
                </div>
                <pre>
                  <code>{block.code}</code>
                </pre>
              </div>
            );
          case "callout": {
            const styles =
              block.tone === "warn"
                ? "border-copper/35 bg-copper/8"
                : block.tone === "tip"
                  ? "border-teal/25 bg-mint/15"
                  : "border-[var(--line)] bg-paper-2/70";
            return (
              <aside
                key={i}
                className={`border-l-[3px] px-5 py-4 text-[0.95rem] leading-relaxed text-ink ${styles}`}
              >
                <p className="type-label mb-2">{block.tone}</p>
                <p className="type-serif text-[1.02rem] text-ink-soft">{block.body}</p>
              </aside>
            );
          }
          case "complexity":
            return (
              <div
                key={i}
                className="grid gap-6 border border-[var(--line)] bg-foam/60 px-5 py-5 sm:grid-cols-2"
              >
                <div>
                  <p className="type-label">Time</p>
                  <p className="mt-2 font-mono text-sm leading-relaxed text-ink">
                    {block.time}
                  </p>
                </div>
                <div>
                  <p className="type-label">Space</p>
                  <p className="mt-2 font-mono text-sm leading-relaxed text-ink">
                    {block.space}
                  </p>
                </div>
                {block.notes && (
                  <p className="type-serif text-sm text-ink-soft sm:col-span-2">
                    {block.notes}
                  </p>
                )}
              </div>
            );
          case "steps":
            return (
              <div key={i} className="step-list">
                {block.title && (
                  <h3 className="type-title mb-4 text-[1.35rem] text-ink">{block.title}</h3>
                )}
                <ol className="space-y-3">
                  {block.items.map((item, j) => (
                    <li key={j} className="step-card flex gap-4">
                      <span className="step-num">{String(j + 1).padStart(2, "0")}</span>
                      <span className="step-text">{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          case "tradeoff":
            return (
              <section key={i} className="tradeoff-section">
                <h3 className="type-title text-[1.25rem] text-ink">{block.title}</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {block.choices.map((c) => (
                    <div key={c.label} className="tradeoff-card">
                      <p className="tradeoff-label">{c.label}</p>
                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="type-label mb-1.5 text-teal">Pros</p>
                          <ul className="tradeoff-list">
                            {c.pros.map((p) => (
                              <li key={p}>{p}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="type-label mb-1.5 text-copper">Cons</p>
                          <ul className="tradeoff-list">
                            {c.cons.map((p) => (
                              <li key={p}>{p}</li>
                            ))}
                          </ul>
                        </div>
                        <p className="tradeoff-when">
                          <span className="font-semibold text-ink">Pick when: </span>
                          {c.when}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          case "capacity":
            return (
              <div key={i} className="capacity-table">
                {block.title && (
                  <h3 className="type-title mb-4 text-[1.2rem] text-ink">{block.title}</h3>
                )}
                <table>
                  <tbody>
                    {block.rows.map((row) => (
                      <tr key={row.label}>
                        <th>{row.label}</th>
                        <td>{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "think":
            return (
              <section key={i} className="heat-panel heat-think">
                <p className="type-label text-[var(--signal)]">How to think</p>
                <h3 className="type-title mt-2 text-[1.35rem] text-ink">
                  {block.title ?? "Hear the problem"}
                </h3>
                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="type-label mb-3">Clarify</p>
                    <ul className="space-y-2">
                      {block.clarify.map((item) => (
                        <li key={item} className="type-serif text-[1.02rem] text-ink-soft">
                          <span className="mr-2 text-teal">▹</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="type-label mb-3">Model</p>
                    <ul className="space-y-2">
                      {block.model.map((item) => (
                        <li key={item} className="type-serif text-[1.02rem] text-ink-soft">
                          <span className="mr-2 text-teal">▹</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {block.pitfalls && block.pitfalls.length > 0 && (
                  <div className="mt-5 border-t border-[var(--line)] pt-4">
                    <p className="type-label mb-2 text-copper">Pitfalls</p>
                    <ul className="space-y-1.5">
                      {block.pitfalls.map((p) => (
                        <li key={p} className="text-sm text-ink-soft">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            );
          case "answer":
            return (
              <section key={i} className="heat-panel heat-answer">
                <p className="type-label">How to answer</p>
                <h3 className="type-title mt-2 text-[1.35rem] text-ink">
                  {block.title ?? "Interview script"}
                </h3>
                <p className="type-serif mt-4 text-[1.08rem] text-ink">
                  “{block.opening}”
                </p>
                <ol className="mt-5 space-y-3">
                  {block.beats.map((beat, j) => (
                    <li key={beat} className="flex gap-3">
                      <span className="font-mono text-sm text-teal">
                        {String(j + 1).padStart(2, "0")}
                      </span>
                      <span className="type-serif text-[1.02rem] text-ink-soft">{beat}</span>
                    </li>
                  ))}
                </ol>
                {block.closing && (
                  <p className="type-serif mt-5 border-t border-[var(--line)] pt-4 text-sm text-ink-soft">
                    {block.closing}
                  </p>
                )}
              </section>
            );
          case "diagram":
            return (
              <div key={i} className="lesson-diagram-wrap">
                <Diagram kind={block.kind} title={block.title} caption={block.caption} />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
