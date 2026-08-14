import Link from "next/link";
import { auth } from "@/auth";
import { AuthButtons } from "@/components/AuthButtons";

const links = [
  { href: "/learn", label: "Curriculum" },
  { href: "/track/method", label: "HEAT" },
  { href: "/track/dsa", label: "DSA" },
  { href: "/problems", label: "Problems" },
  { href: "/track/web", label: "Web" },
  { href: "/track/lld", label: "LLD" },
  { href: "/track/hld", label: "HLD" },
  { href: "/search", label: "Search" },
];

export async function SiteHeader() {
  const session = await auth();

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
        <AuthButtons mode="nav" userName={session?.user?.name} />
      </div>
    </header>
  );
}
