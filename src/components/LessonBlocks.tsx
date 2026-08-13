import type { ContentBlock } from "@/content/types";

export function LessonBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-8">
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
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs uppercase tracking-wider text-mint/80">
                  <span>{block.title ?? "Example"}</span>
                  <span>{block.language}</span>
                </div>
                <pre>
                  <code>{block.code}</code>
                </pre>
              </div>
            );
          case "callout": {
            const styles =
              block.tone === "warn"
                ? "border-copper/40 bg-copper/10"
                : block.tone === "tip"
                  ? "border-teal/30 bg-mint/20"
                  : "border-[var(--line)] bg-paper-2/80";
            return (
              <aside
                key={i}
                className={`rounded-2xl border px-5 py-4 text-sm leading-relaxed text-ink ${styles}`}
              >
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
                  {block.tone}
                </p>
                {block.body}
              </aside>
            );
          }
          case "complexity":
            return (
              <div
                key={i}
                className="grid gap-4 rounded-2xl border border-[var(--line)] bg-foam/70 p-5 sm:grid-cols-2"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-soft">Time</p>
                  <p className="mt-1 font-mono text-sm">{block.time}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-soft">Space</p>
                  <p className="mt-1 font-mono text-sm">{block.space}</p>
                </div>
                {block.notes && (
                  <p className="sm:col-span-2 text-sm text-ink-soft">{block.notes}</p>
                )}
              </div>
            );
          case "steps":
            return (
              <div key={i}>
                {block.title && (
                  <h3 className="mb-3 font-[family-name:var(--font-display)] text-xl font-semibold">
                    {block.title}
                  </h3>
                )}
                <ol className="space-y-3">
                  {block.items.map((item, j) => (
                    <li key={j} className="flex gap-3 text-ink-soft">
                      <span className="font-mono text-sm text-teal">{j + 1}.</span>
                      <span>{item}</span>
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
