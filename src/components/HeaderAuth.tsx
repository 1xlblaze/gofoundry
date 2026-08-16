"use client";

import { useEffect, useState } from "react";
import { NavAuthButtons } from "@/components/NavAuthButtons";

type SessionResponse = {
  user?: { name?: string | null };
};

export function HeaderAuth() {
  const [userName, setUserName] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json() as Promise<SessionResponse>)
      .then((session) => setUserName(session?.user?.name ?? null))
      .catch(() => setUserName(null));
  }, []);

  if (userName === undefined) {
    return (
      <a href="/login" className="primary-btn header-sign-in">
        Sign in
      </a>
    );
  }

  return <NavAuthButtons userName={userName} />;
}
