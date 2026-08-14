import { authConfigured } from "@/auth";
import { AuthButtons } from "@/components/AuthButtons";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/learn");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6 py-16">
      <p className="type-label">Account</p>
      <h1 className="type-title mt-3 text-[var(--text-h1)] text-ink">Sign in</h1>
      <p className="mt-4 text-[var(--text-lead)] leading-relaxed text-ink-soft">
        Google Sign-In by default. Keycloak (open-source IdP) works when{" "}
        <span className="font-mono text-sm">KEYCLOAK_*</span> env vars are set.
      </p>

      {!authConfigured ? (
        <div className="mt-10 border border-[var(--line)] bg-foam/70 p-6">
          <p className="type-label text-copper">Providers not configured</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Set <code className="font-mono text-ink">AUTH_SECRET</code>,{" "}
            <code className="font-mono text-ink">GOOGLE_CLIENT_ID</code>, and{" "}
            <code className="font-mono text-ink">GOOGLE_CLIENT_SECRET</code> on
            Vercel. Redirect URI:{" "}
            <code className="font-mono text-[0.7rem] text-ink">
              https://YOUR_DOMAIN/api/auth/callback/google
            </code>
          </p>
          <Link href="/learn" className="btn-ghost mt-6 inline-flex">
            Continue as guest
          </Link>
        </div>
      ) : (
        <div className="mt-10">
          <AuthButtons mode="login" />
        </div>
      )}
    </div>
  );
}
