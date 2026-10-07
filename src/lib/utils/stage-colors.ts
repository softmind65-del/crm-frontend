import React from "react";
import { StageColorKey } from "@/types/pipeline";
import { BadgeVariant } from "@/components/ui/badge";

export interface StageColorStyle {
  readonly key: StageColorKey;
  readonly label: string;
  readonly dotClass: string;
  readonly badgeVariant: BadgeVariant;
  readonly badgeCustomClass: string;
  readonly containerBg: string;
  readonly borderColor: string;
  readonly topAccent: string;
  readonly headerBorder: string;
  readonly countPill: string;
  readonly dragOverStyle: string;
}

export const STAGE_COLOR_KEYS: readonly StageColorKey[] = [
  "blue",
  "cyan",
  "green",
  "amber",
  "orange",
  "rose",
  "red",
  "purple",
  "violet",
  "indigo",
  "slate",
] as const;

export const PRESET_HEX_MAP: Record<StageColorKey, string> = {
  blue: "#3B82F6",
  cyan: "#06B6D4",
  green: "#10B981",
  amber: "#F59E0B",
  orange: "#F97316",
  rose: "#F43F5E",
  red: "#EF4444",
  purple: "#A855F7",
  violet: "#8B5CF6",
  indigo: "#6366F1",
  slate: "#64748B",
};

export const STAGE_COLOR_STYLES: Record<StageColorKey, StageColorStyle> = {
  blue: {
    key: "blue",
    label: "Blue",
    dotClass: "bg-blue-500",
    badgeVariant: "info",
    badgeCustomClass: "bg-blue-50 text-blue-700 border-blue-200/80",
    containerBg: "bg-blue-50/40",
    borderColor: "border-blue-100",
    topAccent: "border-t-4 border-t-blue-500",
    headerBorder: "border-blue-100/80",
    countPill: "bg-blue-100/80 text-blue-700",
    dragOverStyle: "border-blue-400 bg-blue-50/75 ring-2 ring-blue-400/40",
  },
  cyan: {
    key: "cyan",
    label: "Cyan",
    dotClass: "bg-cyan-500",
    badgeVariant: "info",
    badgeCustomClass: "bg-cyan-50 text-cyan-700 border-cyan-200/80",
    containerBg: "bg-cyan-50/40",
    borderColor: "border-cyan-100",
    topAccent: "border-t-4 border-t-cyan-500",
    headerBorder: "border-cyan-100/80",
    countPill: "bg-cyan-100/80 text-cyan-700",
    dragOverStyle: "border-cyan-400 bg-cyan-50/75 ring-2 ring-cyan-400/40",
  },
  green: {
    key: "green",
    label: "Green",
    dotClass: "bg-emerald-500",
    badgeVariant: "success",
    badgeCustomClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    containerBg: "bg-emerald-50/40",
    borderColor: "border-emerald-100",
    topAccent: "border-t-4 border-t-emerald-500",
    headerBorder: "border-emerald-100/80",
    countPill: "bg-emerald-100/80 text-emerald-700",
    dragOverStyle: "border-emerald-400 bg-emerald-50/75 ring-2 ring-emerald-400/40",
  },
  amber: {
    key: "amber",
    label: "Amber",
    dotClass: "bg-amber-500",
    badgeVariant: "warning",
    badgeCustomClass: "bg-amber-50 text-amber-700 border-amber-200/80",
    containerBg: "bg-amber-50/35",
    borderColor: "border-amber-100",
    topAccent: "border-t-4 border-t-amber-500",
    headerBorder: "border-amber-100/80",
    countPill: "bg-amber-100/80 text-amber-800",
    dragOverStyle: "border-amber-400 bg-amber-50/75 ring-2 ring-amber-400/40",
  },
  orange: {
    key: "orange",
    label: "Orange",
    dotClass: "bg-orange-500",
    badgeVariant: "warning",
    badgeCustomClass: "bg-orange-50 text-orange-700 border-orange-200/80",
    containerBg: "bg-orange-50/35",
    borderColor: "border-orange-100",
    topAccent: "border-t-4 border-t-orange-500",
    headerBorder: "border-orange-100/80",
    countPill: "bg-orange-100/80 text-orange-800",
    dragOverStyle: "border-orange-400 bg-orange-50/75 ring-2 ring-orange-400/40",
  },
  rose: {
    key: "rose",
    label: "Rose",
    dotClass: "bg-rose-500",
    badgeVariant: "neutral",
    badgeCustomClass: "bg-rose-50 text-rose-700 border-rose-200/80",
    containerBg: "bg-rose-50/40",
    borderColor: "border-rose-100",
    topAccent: "border-t-4 border-t-rose-500",
    headerBorder: "border-rose-100/80",
    countPill: "bg-rose-100/80 text-rose-700",
    dragOverStyle: "border-rose-400 bg-rose-50/75 ring-2 ring-rose-400/40",
  },
  red: {
    key: "red",
    label: "Red",
    dotClass: "bg-red-500",
    badgeVariant: "danger",
    badgeCustomClass: "bg-red-50 text-red-700 border-red-200/80",
    containerBg: "bg-red-50/35",
    borderColor: "border-red-100",
    topAccent: "border-t-4 border-t-red-500",
    headerBorder: "border-red-100/80",
    countPill: "bg-red-100/80 text-red-700",
    dragOverStyle: "border-red-400 bg-red-50/75 ring-2 ring-red-400/40",
  },
  purple: {
    key: "purple",
    label: "Purple",
    dotClass: "bg-purple-500",
    badgeVariant: "info",
    badgeCustomClass: "bg-purple-50 text-purple-700 border-purple-200/80",
    containerBg: "bg-purple-50/40",
    borderColor: "border-purple-100",
    topAccent: "border-t-4 border-t-purple-500",
    headerBorder: "border-purple-100/80",
    countPill: "bg-purple-100/80 text-purple-700",
    dragOverStyle: "border-purple-400 bg-purple-50/75 ring-2 ring-purple-400/40",
  },
  violet: {
    key: "violet",
    label: "Violet",
    dotClass: "bg-violet-500",
    badgeVariant: "info",
    badgeCustomClass: "bg-violet-50 text-violet-700 border-violet-200/80",
    containerBg: "bg-violet-50/40",
    borderColor: "border-violet-100",
    topAccent: "border-t-4 border-t-violet-500",
    headerBorder: "border-violet-100/80",
    countPill: "bg-violet-100/80 text-violet-700",
    dragOverStyle: "border-violet-400 bg-violet-50/75 ring-2 ring-violet-400/40",
  },
  indigo: {
    key: "indigo",
    label: "Indigo",
    dotClass: "bg-indigo-500",
    badgeVariant: "info",
    badgeCustomClass: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    containerBg: "bg-indigo-50/40",
    borderColor: "border-indigo-100",
    topAccent: "border-t-4 border-t-indigo-500",
    headerBorder: "border-indigo-100/80",
    countPill: "bg-indigo-100/80 text-indigo-700",
    dragOverStyle: "border-indigo-400 bg-indigo-50/75 ring-2 ring-indigo-400/40",
  },
  slate: {
    key: "slate",
    label: "Slate",
    dotClass: "bg-slate-500",
    badgeVariant: "neutral",
    badgeCustomClass: "bg-slate-100 text-slate-700 border-slate-200/80",
    containerBg: "bg-slate-100/50",
    borderColor: "border-slate-200",
    topAccent: "border-t-4 border-t-slate-500",
    headerBorder: "border-slate-200/80",
    countPill: "bg-slate-200/80 text-slate-700",
    dragOverStyle: "border-slate-400 bg-slate-100/80 ring-2 ring-slate-400/40",
  },
};

export function getStageColorStyle(colorKey?: string | null): StageColorStyle {
  if (colorKey && colorKey in STAGE_COLOR_STYLES) {
    return STAGE_COLOR_STYLES[colorKey as StageColorKey];
  }
  return STAGE_COLOR_STYLES.blue;
}

export function getStageBadgeClasses(colorKey?: string | null): string {
  return getStageColorStyle(colorKey).badgeCustomClass;
}

// -------------------------------------------------------------
// Color Conversion, Normalization & Validation Utilities
// -------------------------------------------------------------

export function isValidHex(hex?: string | null): boolean {
  if (!hex || typeof hex !== "string") return false;
  return /^#[0-9A-Fa-f]{6}$/.test(hex.trim());
}

export function normalizeHex(hex: string): string {
  const trimmed = hex.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return withHash.toUpperCase();
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!isValidHex(hex)) return null;
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const clampedH = ((h % 360) + 360) % 360;
  const clampedS = Math.max(0, Math.min(1, s));
  const clampedV = Math.max(0, Math.min(1, v));

  const c = clampedV * clampedS;
  const x = c * (1 - Math.abs(((clampedH / 60) % 2) - 1));
  const m = clampedV - c;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (clampedH < 60) {
    r1 = c;
    g1 = x;
    b1 = 0;
  } else if (clampedH < 120) {
    r1 = x;
    g1 = c;
    b1 = 0;
  } else if (clampedH < 180) {
    r1 = 0;
    g1 = c;
    b1 = x;
  } else if (clampedH < 240) {
    r1 = 0;
    g1 = x;
    b1 = c;
  } else if (clampedH < 300) {
    r1 = x;
    g1 = 0;
    b1 = c;
  } else {
    r1 = c;
    g1 = 0;
    b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) {
      h = 60 * (((gNorm - bNorm) / delta) % 6);
    } else if (max === gNorm) {
      h = 60 * ((bNorm - rNorm) / delta + 2);
    } else {
      h = 60 * ((rNorm - gNorm) / delta + 4);
    }
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h, s, v };
}

/**
 * Finds the nearest supported semantic preset key based on Euclidean RGB distance.
 * This ensures manual colors maintain a sensible fallback color_key.
 */
export function findClosestColorKey(hex: string): StageColorKey {
  const rgb = hexToRgb(hex);
  if (!rgb) return "blue";

  let closestKey: StageColorKey = "blue";
  let minDistance = Number.POSITIVE_INFINITY;

  for (const key of STAGE_COLOR_KEYS) {
    const presetHex = PRESET_HEX_MAP[key];
    const presetRgb = hexToRgb(presetHex);
    if (!presetRgb) continue;

    const dr = rgb.r - presetRgb.r;
    const dg = rgb.g - presetRgb.g;
    const db = rgb.b - presetRgb.b;
    const distance = dr * dr + dg * dg + db * db;

    if (distance < minDistance) {
      minDistance = distance;
      closestKey = key;
    }
  }

  return closestKey;
}

// -------------------------------------------------------------
// Resolved Stage Color Styles (custom_color_hex ?? semanticColor)
// -------------------------------------------------------------

export interface ResolvedStageColor {
  readonly isCustom: boolean;
  readonly hex: string;
  readonly colorKey: StageColorKey;
  readonly label: string;
  readonly dotClass: string;
  readonly dotStyle: React.CSSProperties;
  readonly columnContainerClass: string;
  readonly columnContainerStyle: React.CSSProperties;
  readonly columnDragOverClass: string;
  readonly columnDragOverStyle: React.CSSProperties;
  readonly headerBorderClass: string;
  readonly headerBorderStyle: React.CSSProperties;
  readonly badgeVariant: BadgeVariant;
  readonly badgeClass: string;
  readonly badgeStyle: React.CSSProperties;
  readonly countPillClass: string;
  readonly countPillStyle: React.CSSProperties;
}

function getContrastingTextColor(r: number, g: number, b: number): string {
  // Relative luminance calculation for readability
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum > 0.6) {
    // Darken by 55% for crisp text on light backgrounds
    return `rgb(${Math.round(r * 0.45)}, ${Math.round(g * 0.45)}, ${Math.round(b * 0.45)})`;
  }
  return `rgb(${Math.max(0, Math.round(r * 0.85))}, ${Math.max(0, Math.round(g * 0.85))}, ${Math.max(0, Math.round(b * 0.85))})`;
}

/**
 * Resolves color tokens preferring custom_color_hex first, falling back to semantic color_key.
 */
export function resolveStageColor(
  colorKey?: string | null,
  customColorHex?: string | null
): ResolvedStageColor {
  const fallbackKey: StageColorKey =
    colorKey && colorKey in STAGE_COLOR_STYLES ? (colorKey as StageColorKey) : "blue";
  const presetStyle = STAGE_COLOR_STYLES[fallbackKey];

  if (isValidHex(customColorHex)) {
    const cleanHex = normalizeHex(customColorHex!);
    const rgb = hexToRgb(cleanHex)!;
    const textColor = getContrastingTextColor(rgb.r, rgb.g, rgb.b);

    return {
      isCustom: true,
      hex: cleanHex,
      colorKey: fallbackKey,
      label: cleanHex,
      dotClass: "w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs ring-1 ring-black/5",
      dotStyle: { backgroundColor: cleanHex },
      columnContainerClass: "border-t-4",
      columnContainerStyle: {
        borderTopColor: cleanHex,
        backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.04)`,
        borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.20)`,
      },
      columnDragOverClass: "ring-2",
      columnDragOverStyle: {
        borderColor: cleanHex,
        backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`,
        boxShadow: `0 0 0 2px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.40)`,
      },
      headerBorderClass: "",
      headerBorderStyle: {
        borderBottomColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.20)`,
      },
      badgeVariant: "neutral",
      badgeClass: "border px-2.5 py-0.5 text-xs font-semibold truncate",
      badgeStyle: {
        backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`,
        borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.30)`,
        color: textColor,
      },
      countPillClass: "inline-flex items-center justify-center px-2 py-0.5 min-w-[20px] rounded-full text-xs font-semibold shrink-0 border",
      countPillStyle: {
        backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`,
        borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`,
        color: textColor,
      },
    };
  }

  return {
    isCustom: false,
    hex: PRESET_HEX_MAP[fallbackKey],
    colorKey: fallbackKey,
    label: presetStyle.label,
    dotClass: `${presetStyle.dotClass} w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs ring-1 ring-black/5`,
    dotStyle: {},
    columnContainerClass: `${presetStyle.containerBg} ${presetStyle.borderColor} ${presetStyle.topAccent}`,
    columnContainerStyle: {},
    columnDragOverClass: presetStyle.dragOverStyle,
    columnDragOverStyle: {},
    headerBorderClass: presetStyle.headerBorder,
    headerBorderStyle: {},
    badgeVariant: presetStyle.badgeVariant,
    badgeClass: `border px-2.5 py-0.5 text-xs font-semibold truncate ${presetStyle.badgeCustomClass}`,
    badgeStyle: {},
    countPillClass: `inline-flex items-center justify-center px-2 py-0.5 min-w-[20px] rounded-full text-xs font-semibold shrink-0 ${presetStyle.countPill}`,
    countPillStyle: {},
  };
}
