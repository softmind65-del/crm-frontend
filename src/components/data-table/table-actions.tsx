"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export interface TableActionItem {
  readonly label: string;
  readonly onSelect: () => void;
  readonly variant?: "default" | "danger";
  readonly disabled?: boolean;
  readonly icon?: React.ReactNode;
}

export interface TableActionsProps {
  readonly actions: readonly TableActionItem[];
  readonly ariaLabel?: string;
  readonly align?: "left" | "right";
  readonly className?: string;
}

export function TableActions({
  actions,
  ariaLabel = "Row actions",
  align = "right",
  className = "",
}: TableActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left?: number;
    right?: number;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isKeyboardOpenRef = useRef(false);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const approxMenuHeight = actions.length * 36 + 12;

    // Check if opening below fits in viewport, flip up if near bottom
    const fitsBelow = rect.bottom + approxMenuHeight < window.innerHeight;
    const top = fitsBelow
      ? rect.bottom + 4
      : Math.max(8, rect.top - approxMenuHeight - 4);

    if (align === "left") {
      const left = Math.min(rect.left, window.innerWidth - 150);
      setMenuPosition({ top, left: Math.max(8, left) });
    } else {
      const right = Math.max(8, window.innerWidth - rect.right);
      setMenuPosition({ top, right });
    }
  }, [actions.length, align]);

  const handleOpen = (fromKeyboard = false) => {
    isKeyboardOpenRef.current = fromKeyboard;
    updatePosition();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Close on outside click, Escape key, or external scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  // Focus the first action only on keyboard trigger, else focus the container for mouse
  useEffect(() => {
    if (isOpen && menuRef.current) {
      if (isKeyboardOpenRef.current) {
        const firstActiveButton = menuRef.current.querySelector<HTMLButtonElement>(
          "button:not([disabled])"
        );
        firstActiveButton?.focus();
      } else {
        menuRef.current.focus();
      }
    }
  }, [isOpen]);

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!menuRef.current) return;
    const buttons = Array.from(
      menuRef.current.querySelectorAll<HTMLButtonElement>("button:not([disabled])")
    );
    if (buttons.length === 0) return;

    const currentIndex = buttons.indexOf(
      document.activeElement as HTMLButtonElement
    );

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % buttons.length;
      buttons[nextIndex]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = currentIndex === -1 ? buttons.length - 1 : (currentIndex - 1 + buttons.length) % buttons.length;
      buttons[prevIndex]?.focus();
    } else if (e.key === "Tab") {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : handleOpen(false))}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            if (!isOpen) {
              e.preventDefault();
              handleOpen(true);
            }
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground-dark hover:bg-slate-100 transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-slate-100 focus-visible:text-foreground-dark cursor-pointer"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="19" cy="12" r="1.75" />
          <circle cx="5" cy="12" r="1.75" />
        </svg>
      </button>

      {isOpen &&
        menuPosition &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="dialog"
            tabIndex={-1}
            aria-label={ariaLabel}
            onKeyDown={handleMenuKeyDown}
            style={{
              position: "fixed",
              top: `${menuPosition.top}px`,
              ...(menuPosition.right !== undefined
                ? { right: `${menuPosition.right}px` }
                : { left: `${menuPosition.left}px` }),
            }}
            className="z-50 min-w-[140px] rounded-lg bg-white border border-border-subtle p-1 shadow-lg focus:outline-none focus:ring-0"
          >
            {actions.map((action, index) => {
              const isDanger = action.variant === "danger";

              return (
                <button
                  key={index}
                  type="button"
                  disabled={action.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!action.disabled) {
                      setIsOpen(false);
                      action.onSelect();
                    }
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-left select-none cursor-pointer focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDanger
                      ? "text-red-600 hover:bg-red-50 focus-visible:bg-red-50 active:bg-red-100"
                      : "text-foreground-dark hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:text-brand active:bg-slate-200/70"
                  }`}
                >
                  {action.icon && (
                    <span className="shrink-0" aria-hidden="true">
                      {action.icon}
                    </span>
                  )}
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
