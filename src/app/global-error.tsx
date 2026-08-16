"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="ambient-host" style={{ margin: 0, color: "#0b1220", background: "#f4f7fb" }}>
        <main style={{ padding: "2.5rem 1.25rem", maxWidth: "36rem", margin: "0 auto" }}>
          <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>Something went wrong</h1>
          <p style={{ margin: "0 0 1.25rem", lineHeight: 1.6 }}>
            An unexpected error occurred. If monitoring is enabled, our team was notified.
          </p>
          <button
            type="button"
            className="primary-btn"
            onClick={() => reset()}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
