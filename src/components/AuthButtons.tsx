import { authConfigured, signIn, signOut } from "@/auth";

async function googleSignIn() {
  "use server";
  await signIn("google", { redirectTo: "/learn" });
}

async function keycloakSignIn() {
  "use server";
  await signIn("keycloak", { redirectTo: "/learn" });
}

async function doSignOut() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export function AuthButtons({
  mode,
  userName,
}: {
  mode: "login" | "nav";
  userName?: string | null;
}) {
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
    if (userName) {
      return (
        <div className="header-actions">
          <span className="user-chip">
            <span
              style={{
                width: "1.55rem",
                height: "1.55rem",
                borderRadius: 999,
                background: "linear-gradient(135deg,#14b8a6,#0f766e)",
                display: "grid",
                placeItems: "center",
                color: "white",
                fontSize: "0.65rem",
                fontWeight: 800,
              }}
            >
              {userName.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden sm:inline">{userName.split(" ")[0]}</span>
          </span>
          <form action={doSignOut}>
            <button type="submit" className="ghost-btn" style={{ padding: "0.4rem 0.8rem", fontSize: "0.78rem" }}>
              Sign out
            </button>
          </form>
        </div>
      );
    }
    return (
      <a href="/login" className="primary-btn header-sign-in">
        Sign in
      </a>
    );
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
