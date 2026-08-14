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
        <a href="/login" className="btn-primary !px-4 !py-2 text-[0.8rem]">
          Sign in
        </a>
      );
    }
    if (userName) {
      return (
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-medium text-ink-soft sm:inline">
            {userName}
          </span>
          <form action={doSignOut}>
            <button type="submit" className="btn-ghost !px-3 !py-1.5 text-[0.75rem]">
              Sign out
            </button>
          </form>
        </div>
      );
    }
    return (
      <a href="/login" className="btn-primary !px-4 !py-2 text-[0.8rem]">
        Sign in
      </a>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {hasGoogle && (
        <form action={googleSignIn}>
          <button type="submit" className="btn-primary w-full">
            Continue with Google
          </button>
        </form>
      )}
      {hasKeycloak && (
        <form action={keycloakSignIn}>
          <button type="submit" className="btn-ghost w-full">
            Continue with Keycloak
          </button>
        </form>
      )}
      {!hasGoogle && !hasKeycloak && (
        <p className="text-sm text-ink-soft">No auth providers configured.</p>
      )}
    </div>
  );
}
