"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/learn", label: "Curriculum" },
  { href: "/lab", label: "Lab" },
  { href: "/diagnostic", label: "Assess" },
  { href: "/problems", label: "Practice" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/cheatsheets", label: "Sheets" },
  { href: "/progress", label: "Progress" },
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
