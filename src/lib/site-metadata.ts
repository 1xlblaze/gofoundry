import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { indexableRobots, noIndexRobots, siteKeywords } from "@/lib/seo";

type PageMetaInput = {
  title: string;
  description: string;
  path?: string;
  type?: "website" | "article";
  keywords?: string[];
  noIndex?: boolean;
  publishedTime?: string;
  tags?: string[];
};

export function buildPageMetadata({
  title,
  description,
  path = "",
  type = "website",
  keywords,
  noIndex = false,
  publishedTime,
  tags,
}: PageMetaInput): Metadata {
  const url = `${siteConfig.url}${path}`;
  const mergedKeywords = keywords
    ? [...new Set([...keywords, ...siteKeywords])]
    : [...siteKeywords];

  return {
    title,
    description,
    keywords: mergedKeywords,
    alternates: { canonical: url },
    robots: noIndex ? noIndexRobots : indexableRobots,
    openGraph: {
      title: `${title} · ${siteConfig.name}`,
      description,
      url,
      siteName: siteConfig.name,
      type,
      locale: "en_US",
      ...(publishedTime ? { publishedTime } : {}),
      ...(tags ? { tags } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${siteConfig.name}`,
      description,
    },
  };
}
