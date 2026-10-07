"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { StageColorKey } from "@/types/pipeline";
import {
  STAGE_COLOR_KEYS,
  STAGE_COLOR_STYLES,
  PRESET_HEX_MAP,
  isValidHex,
  normalizeHex,
  hexToRgb,
  rgbToHex,
  hsvToRgb,
  rgbToHsv,
  findClosestColorKey,
  resolveStageColor,
} from "@/lib/utils/stage-colors";

export interface StageColorPickerProps {
  readonly value: StageColorKey;
  readonly customColorHex?: string | null;
  readonly onChange: (colorKey: StageColorKey, customColorHex: string | null) => void;
  readonly onValidityChange?: (isValid: boolean) => void;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly previewName?: string;
  readonly showPreview?: boolean;
}

const QUICK_PRESET_KEYS: readonly StageColorKey[] = [
  "blue",
  "cyan",
  "green",
  "amber",
  "purple",
] as const;

export function StageColorPicker({
  value,
  customColorHex,
  onChange,
  onValidityChange,
  label = "Stage Color",
  disabled = false,
  previewName,
  showPreview = true,
}: StageColorPickerProps) {
  // Popover / panel state for the custom color picker
  const [isCustomOpen, setIsCustomOpen] = useState(() => Boolean(customColorHex));
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Compute active displayed HEX
  const activeHex = useMemo(() => {
    if (customColorHex && isValidHex(customColorHex)) {
      return normalizeHex(customColorHex);
    }
    return PRESET_HEX_MAP[value] || "#3B82F6";
  }, [value, customColorHex]);

  // Internal HSV state for the color selection square and slider
  const [hsv, setHsv] = useState<{ h: number; s: number; v: number }>(() => {
    const rgb = hexToRgb(activeHex) || { r: 59, g: 130, b: 246 };
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  });

  // Hex input string state
  const [hexInput, setHexInput] = useState<string>(activeHex);
  const [hexError, setHexError] = useState<string | null>(null);

  // Adjust state when external activeHex changes without synchronous setState in effect
  const [prevActiveHex, setPrevActiveHex] = useState(activeHex);
  if (prevActiveHex !== activeHex) {
    setPrevActiveHex(activeHex);
    setHexInput(activeHex);
    setHexError(null);
    const rgb = hexToRgb(activeHex);
    if (rgb) {
      const nextHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHsv((prev) => ({
        h: nextHsv.s === 0 ? prev.h : nextHsv.h,
        s: nextHsv.s,
        v: nextHsv.v,
      }));
    }
  }

  // Saturation / Value rectangle ref and drag handler
  const satValRef = useRef<HTMLDivElement | null>(null);
  const isDraggingSatVal = useRef(false);

  // Hue slider ref and drag handler
  const hueSliderRef = useRef<HTMLDivElement | null>(null);
  const isDraggingHue = useRef(false);

  // Update color from HSV coordinates
  const updateFromHsv = useCallback(
    (newH: number, newS: number, newV: number) => {
      const rgb = hsvToRgb(newH, newS, newV);
      const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);
      const fallbackPreset = findClosestColorKey(newHex);

      setHsv({ h: newH, s: newS, v: newV });
      setHexInput(newHex);
      setHexError(null);
      onValidityChange?.(true);

      onChange(fallbackPreset, newHex);
    },
    [onChange, onValidityChange]
  );

  // Drag listeners for Saturation / Value square
  const handleSatValPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!satValRef.current) return;
      const rect = satValRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

      const s = x / rect.width;
      const v = 1 - y / rect.height;

      updateFromHsv(hsv.h, s, v);
    },
    [hsv.h, updateFromHsv]
  );

  const onSatValMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    isDraggingSatVal.current = true;
    handleSatValPointer(e.clientX, e.clientY);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (isDraggingSatVal.current) {
        handleSatValPointer(moveEvent.clientX, moveEvent.clientY);
      }
    };
    const handleMouseUp = () => {
      isDraggingSatVal.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const onSatValTouchStart = (e: React.TouchEvent) => {
    if (disabled || e.touches.length === 0) return;
    isDraggingSatVal.current = true;
    handleSatValPointer(e.touches[0].clientX, e.touches[0].clientY);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (isDraggingSatVal.current && moveEvent.touches.length > 0) {
        handleSatValPointer(moveEvent.touches[0].clientX, moveEvent.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => {
      isDraggingSatVal.current = false;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
  };

  // Drag listeners for Hue Slider
  const handleHuePointer = useCallback(
    (clientX: number) => {
      if (!hueSliderRef.current) return;
      const rect = hueSliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const fraction = x / rect.width;
      const newHue = Math.min(360, Math.max(0, fraction * 360));

      updateFromHsv(newHue, hsv.s, hsv.v);
    },
    [hsv.s, hsv.v, updateFromHsv]
  );

  const onHueMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    isDraggingHue.current = true;
    handleHuePointer(e.clientX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (isDraggingHue.current) {
        handleHuePointer(moveEvent.clientX);
      }
    };
    const handleMouseUp = () => {
      isDraggingHue.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const onHueTouchStart = (e: React.TouchEvent) => {
    if (disabled || e.touches.length === 0) return;
    isDraggingHue.current = true;
    handleHuePointer(e.touches[0].clientX);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (isDraggingHue.current && moveEvent.touches.length > 0) {
        handleHuePointer(moveEvent.touches[0].clientX);
      }
    };
    const handleTouchEnd = () => {
      isDraggingHue.current = false;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
  };

  // Handle manual HEX input changes
  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.trim();
    if (!raw.startsWith("#")) {
      raw = `#${raw}`;
    }

    setHexInput(raw);

    if (/^#[0-9A-Fa-f]{6}$/.test(raw)) {
      const normalized = raw.toUpperCase();
      setHexError(null);
      onValidityChange?.(true);

      const rgb = hexToRgb(normalized);
      if (rgb) {
        const nextHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        setHsv(nextHsv);
      }

      const fallbackPreset = findClosestColorKey(normalized);
      onChange(fallbackPreset, normalized);
    } else {
      setHexError("Must be a valid hex code (e.g. #3B83F6)");
      onValidityChange?.(false);
    }
  };

  // Preset swatch click handler
  const handleSelectPreset = (key: StageColorKey) => {
    const presetHex = PRESET_HEX_MAP[key];
    const rgb = hexToRgb(presetHex) || { r: 59, g: 130, b: 246 };
    const nextHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

    setHsv(nextHsv);
    setHexInput(presetHex);
    setHexError(null);
    onValidityChange?.(true);

    // Preset selection clears custom_color_hex
    onChange(key, null);
  };

  // Close custom popover on outside click if opened as dropdown
  useEffect(() => {
    if (!isCustomOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        // Only close if user didn't have an active custom color selected
        if (!customColorHex) {
          setIsCustomOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isCustomOpen, customColorHex]);

  const resolved = resolveStageColor(value, customColorHex);

  return (
    <div className="space-y-3">
      {/* Label and Selected Color Header */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground-dark">
            {label}
          </label>
          <span className="text-xs text-muted-foreground font-normal">
            Selected:{" "}
            <span className="font-semibold text-foreground-dark font-mono">
              {resolved.hex}
            </span>
          </span>
        </div>
      )}

      {/* Quick Presets Grid (5 presets + 1 More Colors button) */}
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-2 sm:grid-cols-3 gap-2"
      >
        {QUICK_PRESET_KEYS.map((key) => {
          const style = STAGE_COLOR_STYLES[key];
          const isSelected = !customColorHex && value === key;

          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => handleSelectPreset(key)}
              title={style.label}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer focus:outline-none focus:ring-0 focus-visible:ring-1 focus-visible:ring-brand ${
                isSelected
                  ? "border-brand bg-blue-50/70 text-foreground-dark shadow-2xs font-semibold ring-1 ring-brand/40"
                  : "border-slate-200/90 bg-white text-foreground-dark hover:bg-slate-50 hover:border-slate-300"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs ring-1 ring-black/5 ${style.dotClass}`}
                aria-hidden="true"
              />
              <span className="truncate">{style.label}</span>
            </button>
          );
        })}

        {/* "More Colors" Button */}
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isCustomOpen}
          disabled={disabled}
          onClick={() => setIsCustomOpen((prev) => !prev)}
          title="Open manual custom color picker"
          className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer focus:outline-none focus:ring-0 focus-visible:ring-1 focus-visible:ring-brand ${
            isCustomOpen || Boolean(customColorHex)
              ? "border-brand bg-blue-50/70 text-brand font-semibold ring-1 ring-brand/40"
              : "border-slate-200/90 bg-white text-muted-foreground hover:text-foreground-dark hover:bg-slate-50 hover:border-slate-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {customColorHex ? (
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs ring-1 ring-black/10"
                style={{ backgroundColor: activeHex }}
                aria-hidden="true"
              />
            ) : (
              <svg
                className="w-3.5 h-3.5 shrink-0 text-slate-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C21.998 6.47 17.5 2 12 2z" />
              </svg>
            )}
            <span className="truncate">
              {customColorHex ? `Custom (${activeHex})` : "More Colors"}
            </span>
          </div>

          <svg
            className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
              isCustomOpen ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Real Custom Color Picker Panel (matching the reference screenshot) */}
      {isCustomOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Custom color picker"
          className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-md space-y-4 ring-1 ring-black/5 animate-in fade-in-50 duration-150"
        >
          {/* 1. Large Saturation / Value Color Area */}
          <div
            ref={satValRef}
            onMouseDown={onSatValMouseDown}
            onTouchStart={onSatValTouchStart}
            tabIndex={0}
            role="slider"
            aria-label="Color saturation and brightness"
            aria-valuenow={Math.round(hsv.v * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, Brightness ${Math.round(hsv.v * 100)}%`}
            className="relative w-full h-36 rounded-lg overflow-hidden cursor-crosshair select-none shadow-inner"
            style={{
              backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
            }}
          >
            {/* White horizontal gradient overlay (saturation) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(to right, #ffffff, transparent)",
              }}
            />
            {/* Black vertical gradient overlay (value) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(to bottom, transparent, #000000)",
              }}
            />

            {/* Draggable Selector Ring / Thumb */}
            <div
              className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border-2 border-white shadow-md ring-1 ring-black/30 pointer-events-none transition-transform duration-75"
              style={{
                left: `${hsv.s * 100}%`,
                top: `${(1 - hsv.v) * 100}%`,
                backgroundColor: activeHex,
              }}
            />
          </div>

          {/* 2. Rainbow Hue Slider */}
          <div
            ref={hueSliderRef}
            onMouseDown={onHueMouseDown}
            onTouchStart={onHueTouchStart}
            tabIndex={0}
            role="slider"
            aria-label="Hue slider"
            aria-valuenow={Math.round(hsv.h)}
            aria-valuemin={0}
            aria-valuemax={360}
            className="relative w-full h-3.5 rounded-full cursor-pointer select-none shadow-inner border border-black/10"
            style={{
              background:
                "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
            }}
          >
            {/* Draggable Hue Thumb */}
            <div
              className="absolute w-5 h-5 -ml-2.5 -top-[3px] rounded-full bg-white border border-slate-300 shadow-md ring-1 ring-black/10 pointer-events-none"
              style={{
                left: `${(hsv.h / 360) * 100}%`,
              }}
            />
          </div>

          {/* 3. Color Preview Swatch + HEX Input Field */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              {/* Preview swatch */}
              <div
                className="w-10 h-10 rounded-lg shrink-0 shadow-xs border border-black/15 transition-colors"
                style={{ backgroundColor: activeHex }}
                title={`Active Color: ${activeHex}`}
                aria-hidden="true"
              />

              {/* HEX input with '#' prefix icon */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-sm font-semibold">
                  #
                </div>
                <input
                  type="text"
                  maxLength={7}
                  value={hexInput.replace("#", "")}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
                    handleHexInputChange({
                      ...e,
                      target: { ...e.target, value: clean ? `#${clean}` : "" },
                    } as React.ChangeEvent<HTMLInputElement>);
                  }}
                  placeholder="3B83F6"
                  disabled={disabled}
                  aria-invalid={Boolean(hexError)}
                  aria-describedby={hexError ? "hex-input-error" : undefined}
                  className={`w-full pl-7 pr-3 py-2 rounded-lg border text-sm font-mono tracking-wider transition-all focus:outline-none uppercase ${
                    hexError
                      ? "border-red-400 bg-red-50/30 text-red-700 focus:ring-1 focus:ring-red-400"
                      : "border-slate-300 bg-white text-foreground-dark focus:border-brand focus:ring-1 focus:ring-brand"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                />
              </div>
            </div>

            {/* Inline validation message */}
            {hexError && (
              <p
                id="hex-input-error"
                className="text-xs text-red-600 font-medium pl-1 flex items-center gap-1"
              >
                <span>⚠</span>
                <span>{hexError}</span>
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200/80" />

          {/* 5. Existing Preset Color Swatches along the bottom */}
          <div>
            <div className="text-[11px] font-medium text-muted-foreground mb-2">
              Preset Palette
            </div>
            <div
              role="radiogroup"
              aria-label="Preset color swatches"
              className="flex items-center gap-2 flex-wrap"
            >
              {STAGE_COLOR_KEYS.map((key) => {
                const hex = PRESET_HEX_MAP[key];
                const isSelected = !customColorHex && value === key;

                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={disabled}
                    onClick={() => handleSelectPreset(key)}
                    title={`${STAGE_COLOR_STYLES[key].label} (${hex})`}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand shadow-2xs ${
                      isSelected
                        ? "ring-2 ring-offset-2 ring-brand scale-110"
                        : "ring-1 ring-black/10 hover:ring-black/25"
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Live Stage Preview */}
      {showPreview && (
        <div className="pt-2.5 border-t border-border-subtle/80 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-slate-400 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Preview</span>
          </span>

          <span
            className={resolved.badgeClass}
            style={resolved.badgeStyle}
          >
            <span
              className={resolved.dotClass}
              style={resolved.dotStyle}
              aria-hidden="true"
            />
            <span className="truncate max-w-[200px]">
              {previewName?.trim() || "Stage Name"}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
