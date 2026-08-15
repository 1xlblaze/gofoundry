import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type AnimatedCardProps = {
  children: ReactNode;
  href?: string;
  className?: string;
  accent?: string;
  motion?: boolean;
  style?: CSSProperties;
  ariaLabel?: string;
};

export function AnimatedCard({
  children,
  href,
  className = "",
  accent,
  motion = true,
  style,
  ariaLabel,
}: AnimatedCardProps) {
  const classes = ["animated-card", className].filter(Boolean).join(" ");
  const mergedStyle = accent
    ? ({ ...style, "--card-accent": accent } as CSSProperties)
    : style;
  const motionProps = motion ? { "data-motion": true as const } : {};

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        style={mergedStyle}
        aria-label={ariaLabel}
        {...motionProps}
      >
        {children}
      </Link>
    );
  }

  return (
    <div className={classes} style={mergedStyle} aria-label={ariaLabel} {...motionProps}>
      {children}
    </div>
  );
}
