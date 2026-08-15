"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Primary nav follows the HEAT sequence: Hear → Etch → Anchor → Temper */
export const primaryLinks = [
  { href: "/learn", label: "Hear" },
  { href: "/heat", label: "Etch" },
  { href: "/problems", label: "Anchor" },
  { href: "/lab", label: "Temper" },
];

export const moreLinks = [
  { href: "/diagnostic", label: "Assess" },
  { href: "/progress", label: "Progress" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/cheatsheets", label: "Cheatsheets" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const links = mobile ? [...primaryLinks, ...moreLinks] : primaryLinks;

  if (mobile) {
    return (
      <>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={isActive(pathname, l.href) ? "active" : undefined}
          >
            {l.label}
          </Link>
        ))}
      </>
    );
  }

  return (
    <nav className="nav-links" aria-label="HEAT learning path">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={isActive(pathname, l.href) ? "active" : undefined}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
