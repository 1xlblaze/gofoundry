import Link from "next/link";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  icon,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="ds-empty panel">
      {icon ? <div className="ds-empty-icon">{icon}</div> : null}
      <h3>{title}</h3>
      <p>{description}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="primary-btn">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
