import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/content/blog";

export const metadata: Metadata = {
  title: "Technical Go Articles",
  description:
    "Deep technical articles on Go internals, concurrency, the runtime scheduler, and Kubernetes controller patterns.",
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default function BlogPage() {
  return (
    <main className="shell blog-index">
      <header className="page-hero blog-hero">
        <span className="kicker">Technical field notes</span>
        <h1>Go, under the hood</h1>
        <p>
          Practical explanations of runtime internals and production concurrency,
          written for engineers who need to reason out loud.
        </p>
      </header>

      <div className="blog-grid">
        {blogPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="panel blog-card"
          >
            <article>
              <div className="blog-card-meta">
                <time dateTime={post.date}>
                  {dateFormatter.format(new Date(`${post.date}T00:00:00Z`))}
                </time>
                <span aria-hidden="true">·</span>
                <span>{post.readingMinutes} min read</span>
              </div>
              <h2 className="type-title">{post.title}</h2>
              <p>{post.description}</p>
              <div className="blog-tags" aria-label="Topics">
                {post.tags.map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>
              <span className="blog-read-more" aria-hidden="true">
                Read article <span>→</span>
              </span>
            </article>
          </Link>
        ))}
      </div>
    </main>
  );
}
