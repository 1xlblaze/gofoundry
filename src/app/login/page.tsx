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
          Optional. You can learn as a guest — progress stays in this browser. Sign in with
          Google if you want the same place on another device.
        </p>

        {!authConfigured ? (
          <div className="callout warn">
            <div className="callout-title">Sign-in is paused on this preview</div>
            <p style={{ margin: 0 }}>
              You can still open every lesson, the Lab, and practice problems without an account.
            </p>
            <Link href="/learn" className="secondary-btn" style={{ marginTop: "1rem" }}>
              Continue as guest
            </Link>
          </div>
        ) : (
          <>
            <AuthButtons mode="login" />
            <Link href="/learn" className="ghost-btn" style={{ marginTop: "1rem" }}>
              Continue as guest
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
