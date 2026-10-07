"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItem } from "@/types/navigation";
import { CRM_NAVIGATION_ITEMS, ChevronRightIcon } from "@/constants/navigation";

export interface SidebarProps {
  readonly items?: readonly NavItem[];
  readonly className?: string;
  readonly onNavigate?: () => void;
  readonly onClose?: () => void;
}

export function Sidebar({
  items = CRM_NAVIGATION_ITEMS,
  className = "",
  onNavigate,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (href: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [href]: !prev[href],
    }));
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.exact || item.href === "/") {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const isChildItemActive = (
    child: NavItem,
    siblings?: readonly NavItem[]
  ): boolean => {
    if (pathname === child.href) {
      return true;
    }
    if (child.exact) {
      return false;
    }
    const hasMoreSpecificSibling = siblings?.some(
      (sibling) =>
        sibling.href !== child.href &&
        sibling.href.length > child.href.length &&
        (pathname === sibling.href || pathname.startsWith(`${sibling.href}/`))
    );
    if (hasMoreSpecificSibling) {
      return false;
    }
    return pathname.startsWith(`${child.href}/`);
  };

  const handleLinkClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside
      aria-label="Sidebar navigation"
      className={`w-64 bg-white border-r border-border-subtle flex flex-col flex-shrink-0 h-full ${className}`}
    >
      {/* Brand area: horizontal bottom border removed as per reference */}
      <div className="h-16 flex items-center justify-between px-6">
        <Link
          href="/"
          onClick={handleLinkClick}
          className="inline-flex items-center gap-1.5 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:text-brand rounded-md transition-colors"
          aria-label="AccDoo Home"
        >
          <span className="text-2xl font-bold tracking-tight text-foreground-dark">
            AccDoo CRM
          </span>
        </Link>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground-dark hover:bg-slate-50 transition-colors lg:hidden cursor-pointer focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-slate-100"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav aria-label="Main Navigation" className="flex-1 px-3 py-6 overflow-y-auto">
        <ul role="list" className="space-y-1.5">
          {items.map((item) => {
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const active = isItemActive(item);
            const isExpanded = expandedItems[item.href] ?? active;
            const Icon = item.icon;

            if (hasChildren) {
              return (
                <li key={item.href}>
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.href)}
                    aria-expanded={isExpanded}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[15px] font-medium transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-slate-100 focus-visible:text-brand ${
                      active
                        ? "text-brand font-semibold bg-blue-50/60"
                        : "text-foreground-dark hover:bg-slate-50 hover:text-brand"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {Icon && (
                        <Icon
                          className={`w-5 h-5 shrink-0 transition-colors ${
                            active ? "text-brand" : "text-foreground-dark"
                          }`}
                        />
                      )}
                      <span>{item.label}</span>
                    </div>
                    <ChevronRightIcon
                      className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        isExpanded ? "rotate-90 text-foreground-dark" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && item.children && (
                    <div className="relative mt-1 ml-6">
                      <div
                        aria-hidden="true"
                        className="absolute left-0 -translate-x-1/2 top-0 bottom-0 w-px bg-border-subtle pointer-events-none"
                      />

                      <ul role="list" className="space-y-1">
                        {item.children.map((child) => {
                          const childActive = isChildItemActive(child, item.children);
                          const ChildIcon = child.icon;
                          return (
                            <li key={child.href} className="relative">
                              {childActive && (
                                <span
                                  aria-hidden="true"
                                  className="absolute left-0 -translate-x-1/2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-brand bg-white flex items-center justify-center pointer-events-none z-10"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                                </span>
                              )}
                              <Link
                                href={child.href}
                                onClick={handleLinkClick}
                                aria-current={childActive ? "page" : undefined}
                                className={`flex items-center gap-2.5 ml-3.5 px-2.5 py-1.5 rounded-md text-sm transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-slate-100 focus-visible:text-brand ${
                                  childActive
                                    ? "text-brand font-semibold"
                                    : "text-muted-foreground font-medium hover:bg-slate-50 hover:text-brand"
                                }`}
                              >
                                {ChildIcon && (
                                  <ChildIcon
                                    className={`w-4 h-4 shrink-0 ${
                                      childActive ? "text-brand" : "text-muted-foreground"
                                    }`}
                                  />
                                )}
                                <span>{child.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleLinkClick}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[15px] transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-slate-100 focus-visible:text-brand ${
                    active
                      ? "text-brand font-semibold bg-blue-50/60"
                      : "text-foreground-dark font-medium hover:bg-slate-50 hover:text-brand"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {Icon && (
                      <Icon
                        className={`w-5 h-5 shrink-0 transition-colors ${
                          active ? "text-brand" : "text-foreground-dark"
                        }`}
                      />
                    )}
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
