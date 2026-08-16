import Link from "next/link";
import type { PlatformProblem } from "@/lib/platform/types";
import { CheckoutButton } from "@/components/CheckoutButton";
import { isStripeConfigured } from "@/lib/stripe";

type ProProblemGateProps = {
  problem: PlatformProblem;
};

export function ProProblemGate({ problem }: ProProblemGateProps) {
  const billingLive = isStripeConfigured();

  return (
    <div className="shell problem-workspace-page">
      <div className="panel pro-gate-card">
        <p className="kicker">Pro staff problem</p>
        <h1>{problem.title}</h1>
        <p>
          This workspace is part of the <strong>Pro staff problem bank</strong> — dual
          algorithmic + runtime evaluation with the full Temper diagnostic pipeline.
        </p>
        <ul className="pro-gate-list">
          <li>20 staff DSA problems + 5 LLD component designs</li>
          <li>Full 4-gate diagnostics: vet, escape analysis, race, leak, bench</li>
          <li>Submission history when signed in</li>
        </ul>
        <p className="pro-gate-note">
          <strong>Free today:</strong> two starter problems (
          <Link href="/problems/dsa-01-slice-headers">slice headers</Link>,{" "}
          <Link href="/problems/dsa-02-ring-buffer">ring buffer</Link>) plus the full
          readable curriculum.
        </p>
        <div className="pro-gate-actions">
          {billingLive ? (
            <>
              <CheckoutButton plan="pro-monthly" label="Upgrade to Pro — $18/mo" />
              <Link href="/login" className="secondary-btn">Sign in first</Link>
            </>
          ) : (
            <Link href="/pricing" className="primary-btn">See pricing</Link>
          )}
          <Link href="/problems" className="ghost-btn">Back to practice sheet</Link>
        </div>
      </div>
    </div>
  );
}
