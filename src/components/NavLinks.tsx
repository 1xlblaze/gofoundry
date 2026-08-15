"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLinkItem = {
  href: string;
  label: string;
  sub?: string;
};

/** Primary nav follows the HEAT sequence: Hear → Etch → Anchor → Temper */
export const primaryLinks: NavLinkItem[] = [
  { href: "/learn", label: "Hear", sub: "Curriculum" },
  { href: "/heat", label: "Etch", sub: "HEAT canvas" },
  { href: "/problems", label: "Anchor", sub: "Staff practice" },
  { href: "/lab", label: "Temper", sub: "Go Lab" },
];

export const moreLinks: NavLinkItem[] = [
  { href: "/diagnostic", label: "Assess", sub: "Readiness quiz" },
  { href: "/progress", label: "Progress", sub: "Your ledger" },
  { href: "/pricing", label: "Pricing", sub: "Free in beta" },
  { href: "/blog", label: "Blog", sub: "Deep dives" },
  { href: "/cheatsheets", label: "Cheatsheets", sub: "Quick recall" },
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
            className={`mobile-nav-link${isActive(pathname, l.href) ? " active" : ""}`}
          >
            <span className="mobile-nav-link-label">{l.label}</span>
            {l.sub ? <span className="mobile-nav-link-sub">{l.sub}</span> : null}
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
          title={l.sub ? `${l.label} — ${l.sub}` : l.label}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
