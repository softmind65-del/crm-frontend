import React from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  readonly label?: React.ReactNode;
  readonly href?: string;
  readonly icon?: React.ReactNode;
  readonly ariaLabel?: string;
}

export interface BreadcrumbsProps {
  readonly items: readonly BreadcrumbItem[];
  readonly className?: string;
  readonly separator?: React.ReactNode;
}

export function HomeIcon({
  className = "w-4 h-4 text-brand shrink-0",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M3 10.5L11.15 3.5a1.3 1.3 0 0 1 1.7 0L21 10.5v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8z" />
      <path d="M10 16.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export const HOME_BREADCRUMB_ITEM: BreadcrumbItem = {
  icon: <HomeIcon />,
  href: "/",
  ariaLabel: "Home",
};

function DefaultSeparator() {
  return (
    <svg
      className="h-3.5 w-3.5 text-muted-foreground shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function Breadcrumbs({
  items,
  className = "",
  separator = <DefaultSeparator />,
}: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-sm ${className}`}>
      <ol className="flex items-center flex-wrap gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const key = item.ariaLabel || (typeof item.label === "string" ? item.label : `crumb-${index}`);

          return (
            <li key={key} className="inline-flex items-center gap-2">
              {index > 0 && (
                <span className="flex items-center" aria-hidden="true">
                  {separator}
                </span>
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  aria-label={item.ariaLabel}
                  className="text-muted-foreground hover:text-brand transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:text-brand rounded"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ) : (
                <span
                  className="font-medium text-foreground-dark inline-flex items-center gap-1.5"
                  aria-current={isLast ? "page" : undefined}
                  aria-label={item.ariaLabel}
                >
                  {item.icon}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
