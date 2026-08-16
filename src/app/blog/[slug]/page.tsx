import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { blogPosts, getBlogPost } from "@/content/blog";
import { buildPageMetadata } from "@/lib/site-metadata";
import { articleJsonLd } from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const dynamicParams = false;

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {};
  }

  return buildPageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${slug}`,
    type: "article",
    keywords: post.tags,
    publishedTime: post.date,
    tags: post.tags,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const paragraphs = post.body.split("\n\n");

  return (
    <main className="shell blog-article-shell">
      <JsonLd
        data={articleJsonLd({
          title: post.title,
          description: post.description,
          path: `/blog/${slug}`,
          datePublished: post.date,
          tags: post.tags,
        })}
      />
      <article className="blog-article">
        <Link href="/blog" className="blog-back-link">
          ← All articles
        </Link>

        <header className="panel blog-article-header">
          <div className="blog-article-meta">
            <time dateTime={post.date}>
              {dateFormatter.format(new Date(`${post.date}T00:00:00Z`))}
            </time>
            <span aria-hidden="true">·</span>
            <span>{post.readingMinutes} min read</span>
          </div>
          <h1>{post.title}</h1>
          <p>{post.description}</p>
          <div className="blog-tags" aria-label="Topics">
            {post.tags.map((tag) => (
              <span key={tag} className="chip chip-brand">
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div className="prose-block blog-prose">
          {paragraphs.map((paragraph, index) => (
            <p key={`${post.slug}-${index}`}>{paragraph}</p>
          ))}
        </div>
      </article>

      <aside className="panel blog-cta" aria-labelledby="blog-cta-title">
        <div>
          <p className="type-label">Turn the model into muscle memory</p>
          <h2 id="blog-cta-title" className="type-title">
            Explore it, then practice it
          </h2>
          <p>
            Open the visual lab for interactive runtime models, or continue through
            the structured Go curriculum.
          </p>
        </div>
        <div className="blog-cta-actions">
          <Link href="/lab" className="primary-btn">
            Open visual lab
          </Link>
          <Link href="/learn" className="secondary-btn">
            Browse curriculum
          </Link>
        </div>
      </aside>
    </main>
  );
}
