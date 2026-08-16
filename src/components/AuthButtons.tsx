import { authConfigured } from "@/auth";
import { NavAuthButtons } from "@/components/NavAuthButtons";
import { googleSignIn, keycloakSignIn } from "@/lib/auth-actions";

export function AuthButtons({ mode, userName }: { mode: "login" | "nav"; userName?: string | null }) {
  const hasGoogle = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  const hasKeycloak = Boolean(
    process.env.KEYCLOAK_CLIENT_ID &&
      process.env.KEYCLOAK_CLIENT_SECRET &&
      process.env.KEYCLOAK_ISSUER,
  );

  if (mode === "nav") {
    if (!authConfigured) {
      return (
        <a href="/login" className="primary-btn header-sign-in">
          Sign in
        </a>
      );
    }
    return <NavAuthButtons userName={userName} />;
  }

  return (
    <div className="auth-actions">
      {hasGoogle && (
        <form action={googleSignIn}>
          <button type="submit" className="primary-btn provider-btn">
            Continue with Google
          </button>
        </form>
      )}
      {hasKeycloak && (
        <form action={keycloakSignIn}>
          <button type="submit" className="secondary-btn provider-btn">
            Continue with Keycloak
          </button>
        </form>
      )}
      {!hasGoogle && !hasKeycloak && (
        <p className="text-ink-soft">No auth providers configured.</p>
      )}
    </div>
  );
}
