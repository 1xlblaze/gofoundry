import type { Metadata } from "next";
import type { MetadataRoute } from "next";
import { blogPosts } from "@/content/blog";
import { allLessons, tracks } from "@/content";
import { platformProblems } from "@/content/platform-problems/index";
import { siteConfig } from "@/lib/site";

/** Core keywords for Go interview prep and staff-engineer curriculum pages. */
export const siteKeywords = [
  "Go programming",
  "Golang interview",
  "Go concurrency",
  "Go runtime",
  "Go LLD",
  "Go HLD",
  "staff engineer Go",
  "Go interview prep",
  "Go data structures",
  "Go system design",
  "HEAT method",
  "Go learning platform",
] as const;

export const indexableRobots: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
};

export const noIndexRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export function absoluteUrl(path = ""): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return path ? `${siteConfig.url}${normalized}` : siteConfig.url;
}

type SitemapPage = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  lastModified?: string | Date;
};

/** Static marketing and product surfaces worth indexing. */
const staticPages: SitemapPage[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/learn", changeFrequency: "weekly", priority: 0.9 },
  { path: "/lab", changeFrequency: "weekly", priority: 0.85 },
  { path: "/heat", changeFrequency: "weekly", priority: 0.85 },
  { path: "/problems", changeFrequency: "weekly", priority: 0.85 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.7 },
  { path: "/sandbox", changeFrequency: "monthly", priority: 0.65 },
  { path: "/search", changeFrequency: "weekly", priority: 0.6 },
  { path: "/cheatsheets", changeFrequency: "monthly", priority: 0.75 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.75 },
  { path: "/diagnostic", changeFrequency: "monthly", priority: 0.7 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

function toSitemapEntry(page: SitemapPage): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(page.path),
    lastModified: page.lastModified ?? new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  };
}

/** All indexable URLs for sitemap.xml generation. */
export function buildSitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = staticPages.map(toSitemapEntry);

  for (const track of tracks) {
    entries.push(
      toSitemapEntry({
        path: `/track/${track.id}`,
        changeFrequency: "weekly",
        priority: 0.85,
      }),
    );
  }

  for (const lesson of allLessons) {
    entries.push(
      toSitemapEntry({
        path: `/lesson/${lesson.slug}`,
        changeFrequency: "monthly",
        priority: 0.8,
      }),
    );
  }

  for (const problem of platformProblems) {
    entries.push(
      toSitemapEntry({
        path: `/problems/${problem.id}`,
        changeFrequency: "monthly",
        priority: 0.75,
      }),
    );
  }

  for (const post of blogPosts) {
    entries.push(
      toSitemapEntry({
        path: `/blog/${post.slug}`,
        changeFrequency: "monthly",
        priority: 0.7,
        lastModified: post.date,
      }),
    );
  }

  return entries;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.tagline,
    email: siteConfig.contactEmail,
    sameAs: [siteConfig.githubRepo],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.tagline,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function learningResourceJsonLd({
  title,
  description,
  path,
  trackTitle,
}: {
  title: string;
  description: string;
  path: string;
  trackTitle: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: title,
    description,
    url: absoluteUrl(path),
    learningResourceType: "Lesson",
    inLanguage: "en",
    isPartOf: {
      "@type": "Course",
      name: trackTitle,
      provider: {
        "@type": "Organization",
        name: siteConfig.name,
        url: siteConfig.url,
      },
    },
  };
}

export function articleJsonLd({
  title,
  description,
  path,
  datePublished,
  tags,
}: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  tags: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: absoluteUrl(path),
    datePublished,
    dateModified: datePublished,
    inLanguage: "en",
    keywords: tags.join(", "),
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}
