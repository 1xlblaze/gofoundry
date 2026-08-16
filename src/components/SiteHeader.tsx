import Link from "next/link";
import { HeaderAuth } from "@/components/HeaderAuth";
import { HeaderChrome } from "@/components/HeaderChrome";
import { allLessons } from "@/content";

export function SiteHeader() {
  return (
    <HeaderChrome
      totalLessons={allLessons.length}
      brand={
        <Link href="/" className="brand">
          <span className="brand-mark">GF</span>
          GoFoundry
        </Link>
      }
      auth={<HeaderAuth />}
    />
  );
}
