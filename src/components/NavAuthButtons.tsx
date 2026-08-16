"use client";

import { doSignOut } from "@/lib/auth-actions";

export function NavAuthButtons({ userName }: { userName?: string | null }) {
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
