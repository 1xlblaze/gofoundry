import { authConfigured } from "@/auth";
import { AuthButtons } from "@/components/AuthButtons";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/learn");

  return (
    <div className="shell" style={{ padding: "3rem 0" }}>
      <div className="panel auth-card reveal">
        <p className="kicker" style={{ marginBottom: "0.85rem" }}>Account</p>
        <h1>Sign in</h1>
        <p>
          Google Sign-In by default. Keycloak works when{" "}
          <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.85em" }}>KEYCLOAK_*</code>{" "}
          env vars are set.
        </p>

        {!authConfigured ? (
          <div className="callout warn">
            <div className="callout-title">Providers not configured</div>
            <p style={{ margin: 0 }}>
              Set AUTH_SECRET, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET on Vercel.
            </p>
            <Link href="/learn" className="secondary-btn" style={{ marginTop: "1rem" }}>
              Continue as guest
            </Link>
          </div>
        ) : (
          <AuthButtons mode="login" />
        )}
      </div>
    </div>
  );
}
