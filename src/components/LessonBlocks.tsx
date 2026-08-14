import type { ContentBlock } from "@/content/types";
import { Diagram } from "@/components/Diagram";
import { CodeBlock } from "@/components/CodeBlock";

export function LessonBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="content-stack" style={{ gap: "1.35rem" }}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "prose":
            return (
              <div key={i} className="panel prose-block reveal">
                {block.title && <h3>{block.title}</h3>}
                {block.body.split("\n\n").map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            );
          case "code":
            return (
              <CodeBlock
                key={i}
                title={block.title}
                language={block.language}
                code={block.code}
              />
            );
          case "callout": {
            const tone = block.tone === "warn" ? "warn" : block.tone === "tip" ? "tip" : "info";
            return (
              <aside key={i} className={`callout ${tone}`}>
                <div className="callout-title">{block.tone}</div>
                <p style={{ margin: 0 }}>{block.body}</p>
              </aside>
            );
          }
          case "complexity":
            return (
              <div key={i} className="complexity-grid">
                <div className="complexity-item">
                  <span>Time</span>
                  <strong>{block.time}</strong>
                </div>
                <div className="complexity-item">
                  <span>Space</span>
                  <strong>{block.space}</strong>
                </div>
                {block.notes && (
                  <p style={{ gridColumn: "1 / -1", margin: 0, color: "var(--ink-soft)" }}>
                    {block.notes}
                  </p>
                )}
              </div>
            );
          case "steps":
            return (
              <div key={i} className="panel prose-block">
                {block.title && (
                  <h3 style={{ marginTop: 0 }}>{block.title}</h3>
                )}
                <ol className="steps">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
            );
          case "tradeoff":
            return (
              <section key={i} className="tradeoff-grid">
                <h3 className="type-title" style={{ margin: 0, gridColumn: "1 / -1" }}>
                  {block.title}
                </h3>
                {block.choices.map((c) => (
                  <div key={c.label} className="tradeoff-card">
                    <h3>{c.label}</h3>
                    <div className="tradeoff-cols">
                      <div className="tradeoff-col pros">
                        <h4>Pros</h4>
                        <ul>
                          {c.pros.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="tradeoff-col cons">
                        <h4>Cons</h4>
                        <ul>
                          {c.cons.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <p className="tradeoff-when">
                      <strong>Pick when: </strong>
                      {c.when}
                    </p>
                  </div>
                ))}
              </section>
            );
          case "capacity":
            return (
              <div key={i}>
                {block.title && (
                  <h3 className="type-title" style={{ marginBottom: "0.75rem" }}>
                    {block.title}
                  </h3>
                )}
                <div className="capacity-grid">
                  {block.rows.map((row) => (
                    <div key={row.label} className="capacity-item">
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            );
          case "think":
            return (
              <section key={i} className="think-panel">
                <h3>{block.title ?? "How to think"}</h3>
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div>
                    <p className="type-label" style={{ marginBottom: "0.45rem" }}>
                      Clarify
                    </p>
                    <ul>
                      {block.clarify.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="type-label" style={{ marginBottom: "0.45rem" }}>
                      Model
                    </p>
                    <ul>
                      {block.model.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  {block.pitfalls && block.pitfalls.length > 0 && (
                    <div>
                      <p className="type-label" style={{ marginBottom: "0.45rem", color: "var(--accent)" }}>
                        Pitfalls
                      </p>
                      <ul>
                        {block.pitfalls.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            );
          case "answer":
            return (
              <section key={i} className="answer-panel">
                <h3>{block.title ?? "How to answer"}</h3>
                <p style={{ margin: "0 0 0.75rem", fontWeight: 600 }}>
                  “{block.opening}”
                </p>
                <ol>
                  {block.beats.map((beat) => (
                    <li key={beat}>{beat}</li>
                  ))}
                </ol>
                {block.closing && (
                  <p style={{ margin: "0.85rem 0 0", color: "var(--ink-soft)" }}>
                    {block.closing}
                  </p>
                )}
              </section>
            );
          case "diagram":
            return (
              <figure key={i} className="diagram-callout panel">
                <div className="diagram-callout-head">
                  <span className="diagram-callout-badge">Visual anchor</span>
                  {block.title && <h3>{block.title}</h3>}
                </div>
                <Diagram kind={block.kind} caption={block.caption} />
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
