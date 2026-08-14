import Link from "next/link";
import { auth } from "@/auth";
import { AuthButtons } from "@/components/AuthButtons";
import { HeaderChrome } from "@/components/HeaderChrome";

export async function SiteHeader() {
  const session = await auth();

  return (
    <HeaderChrome
      brand={
        <Link href="/" className="brand">
          <span className="brand-mark">GF</span>
          GoFoundry
        </Link>
      }
      auth={<AuthButtons mode="nav" userName={session?.user?.name} />}
    />
  );
}
