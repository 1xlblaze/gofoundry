"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/learn", label: "Curriculum" },
  { href: "/progress", label: "Progress" },
  { href: "/track/method", label: "HEAT" },
  { href: "/track/dsa", label: "DSA" },
  { href: "/problems", label: "Problems" },
  { href: "/track/hld", label: "HLD" },
  { href: "/search", label: "Search" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

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
    <nav className="nav-links" aria-label="Primary">
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
