import Link from "next/link";

const links = [
  { href: "/learn", label: "Curriculum" },
  { href: "/track/dsa", label: "DSA" },
  { href: "/track/internals", label: "Internals" },
  { href: "/track/lld", label: "LLD" },
  { href: "/track/hld", label: "HLD" },
  { href: "/search", label: "Search" },
];

export function SiteHeader() {
  return (
    <header className="nav-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="brand-mark text-xl font-semibold text-ink">
          GoFoundry
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="transition-colors hover:text-teal-deep"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/learn"
          className="rounded-full bg-teal-deep px-4 py-2 text-sm font-semibold text-foam transition hover:bg-teal"
        >
          Start learning
        </Link>
      </div>
    </header>
  );
}
