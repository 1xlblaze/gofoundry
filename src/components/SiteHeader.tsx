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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" className="brand-mark text-[1.35rem] text-ink">
          GoFoundry
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[0.8rem] font-semibold tracking-wide text-ink-soft transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link href="/learn" className="btn-primary !px-4 !py-2 text-[0.8rem]">
          Start learning
        </Link>
      </div>
    </header>
  );
}
