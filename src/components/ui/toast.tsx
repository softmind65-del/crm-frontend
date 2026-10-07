"use client";

import React, { useCallback, useEffect, useRef } from "react";

export { ToastProvider, useToast, ToastFlushBridge } from "./toast-provider";
export type { ToastContextValue, ToastProviderProps } from "./toast-provider";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastInput {
  readonly variant?: ToastVariant;
  readonly title: string;
  readonly description?: string;
  readonly duration?: number;
}

export interface ToastItem extends ToastInput {
  readonly id: string;
  readonly variant: ToastVariant;
  readonly createdAt: number;
  readonly isExiting?: boolean;
}

export interface ToastProps {
  readonly toast: ToastItem;
  readonly onDismiss: (id: string) => void;
}

export const DEFAULT_TOAST_DURATIONS: Record<ToastVariant, number> = {
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 6000,
};

function SuccessIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="w-4 h-4"
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
  );
}

interface VariantStyleConfig {
  readonly iconContainerClass: string;
  readonly cardBorderClass: string;
  readonly icon: React.ReactNode;
  readonly role: "status" | "alert";
  readonly ariaLive: "polite" | "assertive";
}

const VARIANT_CONFIGS: Record<ToastVariant, VariantStyleConfig> = {
  success: {
    iconContainerClass: "bg-emerald-50 text-emerald-600 border border-emerald-200/70",
    cardBorderClass: "border-l-[3px] border-l-emerald-500",
    icon: <SuccessIcon />,
    role: "status",
    ariaLive: "polite",
  },
  error: {
    iconContainerClass: "bg-rose-50 text-rose-600 border border-rose-200/70",
    cardBorderClass: "border-l-[3px] border-l-rose-500",
    icon: <ErrorIcon />,
    role: "alert",
    ariaLive: "assertive",
  },
  warning: {
    iconContainerClass: "bg-amber-50 text-amber-600 border border-amber-200/70",
    cardBorderClass: "border-l-[3px] border-l-amber-500",
    icon: <WarningIcon />,
    role: "status",
    ariaLive: "polite",
  },
  info: {
    iconContainerClass: "bg-blue-50 text-brand border border-blue-200/70",
    cardBorderClass: "border-l-[3px] border-l-brand",
    icon: <InfoIcon />,
    role: "status",
    ariaLive: "polite",
  },
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const config = VARIANT_CONFIGS[toast.variant];
  const initialDuration = toast.duration ?? DEFAULT_TOAST_DURATIONS[toast.variant];

  const remainingRef = useRef<number>(initialDuration);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveredRef = useRef<boolean>(false);
  const isFocusedRef = useRef<boolean>(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (ms: number) => {
      clearTimer();
      if (ms <= 0 || !isFinite(ms)) return;
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        onDismiss(toast.id);
      }, ms);
    },
    [clearTimer, onDismiss, toast.id]
  );

  const pauseTimer = useCallback(() => {
    if (remainingRef.current <= 0 || !isFinite(remainingRef.current)) return;
    clearTimer();
    const elapsed = Date.now() - startTimeRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
  }, [clearTimer]);

  const resumeTimer = useCallback(() => {
    if (isHoveredRef.current || isFocusedRef.current) return;
    // Guarantee safe minimum duration when resuming countdown
    const nextDuration = Math.max(remainingRef.current, 1000);
    startTimer(nextDuration);
  }, [startTimer]);

  useEffect(() => {
    remainingRef.current = initialDuration;
    startTimer(initialDuration);

    return () => {
      clearTimer();
    };
  }, [initialDuration, startTimer, clearTimer]);

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    pauseTimer();
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    resumeTimer();
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
    pauseTimer();
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // Avoid resume if focus remains within interactive controls of the toast
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    isFocusedRef.current = false;
    resumeTimer();
  };

  return (
    <div
      role={config.role}
      aria-live={config.ariaLive}
      aria-atomic="true"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`pointer-events-auto relative flex w-full items-start gap-3 rounded-xl border border-border-subtle bg-white p-3.5 sm:p-4 shadow-lg shadow-slate-900/5 ${config.cardBorderClass} ${
        toast.isExiting
          ? "opacity-0 translate-y-[-4px] scale-[0.98] transition-all duration-150 ease-in motion-reduce:transition-none"
          : "animate-toast-in opacity-100 translate-y-0 scale-100"
      }`}
    >
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${config.iconContainerClass}`}
        aria-hidden="true"
      >
        {config.icon}
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <h3 className="text-sm font-semibold text-foreground-dark leading-snug break-words">
          {toast.title}
        </h3>
        {toast.description && (
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed break-words">
            {toast.description}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 p-1 text-muted-foreground hover:text-foreground-dark hover:bg-slate-100 rounded-md transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-slate-100 focus-visible:text-foreground-dark cursor-pointer -mr-1 -mt-0.5"
      >
        <CloseIcon />
      </button>
    </div>
  );
}
