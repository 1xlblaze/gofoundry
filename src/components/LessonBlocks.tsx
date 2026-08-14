import type { ContentBlock } from "@/content/types";

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
              <div key={i}>
                {block.title && (
                  <h3 className="type-title mb-4 text-[1.35rem] text-ink">{block.title}</h3>
                )}
                <ol className="space-y-3.5">
                  {block.items.map((item, j) => (
                    <li key={j} className="flex gap-4">
                      <span className="font-mono text-sm font-medium text-teal">
                        {String(j + 1).padStart(2, "0")}
                      </span>
                      <span className="type-serif text-[1.05rem] text-ink-soft">{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
