"use client";

import React, { useState, useRef, useEffect, useId, useMemo, useCallback } from "react";

export interface ContactPickerOption {
  readonly value: string;
  readonly label: string;
  readonly sublabel?: string | null;
  readonly customerId?: string;
}

export interface ContactPickerProps {
  readonly options?: readonly ContactPickerOption[];
  readonly initialOption?: ContactPickerOption | null;
  readonly value?: string | null;
  readonly onChange: (value: string | null, option?: ContactPickerOption | null) => void;
  readonly customerId?: string | null;
  readonly label?: string;
  readonly required?: boolean;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly error?: string;
  readonly helperText?: string;
  readonly className?: string;
  readonly id?: string;
}

interface RawContactApiItem {
  readonly id: string;
  readonly customer_id: string;
  readonly name: string;
  readonly job_title?: string | null;
}

/**
 * Reusable ContactPicker combobox UI component.
 * Filters contacts by the parent Customer, supports remote BFF search, clear,
 * keyboard navigation, and listbox accessibility semantics.
 */
export function ContactPicker({
  options: staticOptions,
  initialOption,
  value,
  onChange,
  customerId,
  label,
  required = false,
  placeholder = "Select a contact...",
  disabled = false,
  error,
  helperText,
  className = "",
  id,
}: ContactPickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-listbox`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = !error && helperText ? `${inputId}-helper` : undefined;
  const describedBy = errorId ?? helperId;

  // Contact picker is disabled if explicitly disabled OR if no customer is selected
  const isCustomerSelected = Boolean(customerId && customerId.trim());
  const effectiveDisabled = disabled || !isCustomerSelected;

  const effectivePlaceholder = !isCustomerSelected
    ? "Select a customer first"
    : placeholder;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // Remote data state
  const [remoteOptions, setRemoteOptions] = useState<readonly ContactPickerOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasLoadedForCustomer, setHasLoadedForCustomer] = useState<string | null>(null);

  // Store known options cache (e.g. from initialOption or past searches)
  const [cachedOptions, setCachedOptions] = useState<Record<string, ContactPickerOption>>(() => {
    const initialMap: Record<string, ContactPickerOption> = {};
    if (initialOption) {
      initialMap[initialOption.value] = initialOption;
    }
    return initialMap;
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const requestSeqRef = useRef<number>(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  // Track customer ID changes to reset contacts
  const prevCustomerIdRef = useRef<string | null | undefined>(customerId);
  useEffect(() => {
    if (prevCustomerIdRef.current !== customerId) {
      prevCustomerIdRef.current = customerId;
      setRemoteOptions([]);
      setHasLoadedForCustomer(null);
      setFetchError(null);
    }
  }, [customerId]);

  const activeOptions = useMemo(() => {
    if (staticOptions) {
      const customerScoped = customerId
        ? staticOptions.filter((opt) => !opt.customerId || opt.customerId === customerId)
        : staticOptions;
      if (!searchQuery.trim()) return customerScoped;
      const q = searchQuery.toLowerCase().trim();
      return customerScoped.filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
      );
    }
    return remoteOptions;
  }, [staticOptions, customerId, remoteOptions, searchQuery]);

  const selectedOption = useMemo(() => {
    if (!value) return null;
    if (initialOption && initialOption.value === value) return initialOption;
    if (cachedOptions[value]) return cachedOptions[value];
    if (staticOptions) {
      return staticOptions.find((opt) => opt.value === value) ?? null;
    }
    return remoteOptions.find((opt) => opt.value === value) ?? null;
  }, [value, initialOption, cachedOptions, staticOptions, remoteOptions]);

  // Fetch contacts from same-origin BFF with request sequence and AbortController
  const fetchRemoteContacts = useCallback(
    async (query: string) => {
      if (staticOptions || !customerId || !customerId.trim()) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const currentSeq = ++requestSeqRef.current;

      setIsLoading(true);
      setFetchError(null);

      try {
        const params = new URLSearchParams();
        params.set("customer_id", customerId.trim());
        params.set("page", "1");
        params.set("page_size", "20");
        if (query.trim()) {
          params.set("search", query.trim());
        }

        const response = await fetch(`/api/crm/contacts?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch contacts");
        }

        const result: unknown = await response.json();

        // Discard stale responses from earlier queries
        if (currentSeq !== requestSeqRef.current) return;

        if (
          result &&
          typeof result === "object" &&
          "items" in result &&
          Array.isArray((result as { items: unknown }).items)
        ) {
          const rawItems = (result as { items: readonly RawContactApiItem[] }).items;
          const mapped: ContactPickerOption[] = rawItems.map((item) => ({
            value: item.id,
            label: item.name,
            sublabel: item.job_title ?? null,
            customerId: item.customer_id,
          }));

          setRemoteOptions(mapped);

          // Update cached options with freshly fetched items
          setCachedOptions((prev) => {
            const updated = { ...prev };
            for (const opt of mapped) {
              updated[opt.value] = opt;
            }
            return updated;
          });
        } else {
          setRemoteOptions([]);
        }

        setIsLoading(false);
        setHasLoadedForCustomer(customerId);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        if (currentSeq === requestSeqRef.current) {
          setFetchError("Unable to load contacts.");
          setIsLoading(false);
        }
      }
    },
    [staticOptions, customerId]
  );

  // Cleanup abort controller and debounce timer on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
      activeEl?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  const handleOpen = () => {
    if (effectiveDisabled) return;
    setHighlightedIndex(-1);
    setIsOpen(true);

    if (!staticOptions && hasLoadedForCustomer !== customerId) {
      fetchRemoteContacts("");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
    triggerRef.current?.focus();
  };

  const handleSelect = (option: ContactPickerOption) => {
    setCachedOptions((prev) => ({ ...prev, [option.value]: option }));
    onChange(option.value, option);
    setIsOpen(false);
    setSearchQuery("");
    triggerRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (effectiveDisabled) return;
    onChange(null, null);
    triggerRef.current?.focus();
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setHighlightedIndex(0);

    if (staticOptions) return;

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      fetchRemoteContacts(q);
    }, 320);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (effectiveDisabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < activeOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : activeOptions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < activeOptions.length) {
        handleSelect(activeOptions[highlightedIndex]);
      }
    }
  };

  return (
    <div ref={containerRef} className={`w-full relative ${className}`}>
      {label && (
        <label
          id={`${inputId}-label`}
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground-dark mb-1.5"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1 select-none" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {/* Main Trigger Button */}
      <button
        ref={triggerRef}
        id={inputId}
        type="button"
        role="combobox"
        disabled={effectiveDisabled}
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-labelledby={label ? `${inputId}-label ${inputId}` : undefined}
        aria-describedby={describedBy}
        aria-required={required}
        aria-invalid={Boolean(error)}
        className={`w-full h-10 px-3.5 flex items-center justify-between rounded-lg text-sm bg-white border transition-colors text-left focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer ${
          error
            ? "border-red-500 focus-visible:border-red-500"
            : "border-border-subtle hover:border-slate-300 focus-visible:border-brand"
        } ${isOpen ? "border-brand" : ""}`}
      >
        <span
          className={`block truncate mr-2 ${
            selectedOption ? "text-foreground-dark font-medium" : "text-muted-foreground"
          }`}
        >
          {selectedOption ? selectedOption.label : effectivePlaceholder}
        </span>

        <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
          {selectedOption && !effectiveDisabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(null, null);
                }
              }}
              title="Clear selection"
              aria-label="Clear selected contact"
              className="p-1 rounded hover:bg-slate-100 hover:text-foreground-dark transition-colors cursor-pointer focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-slate-100 focus-visible:text-foreground-dark"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          )}

          <svg
            className={`w-4 h-4 transition-transform duration-150 ${
              isOpen ? "rotate-180 text-foreground-dark" : "text-muted-foreground"
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
        </div>
      </button>

      {/* Helper text or error */}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : !isCustomerSelected ? (
        <p id={helperId} className="mt-1.5 text-xs text-muted-foreground">
          Select a customer first.
        </p>
      ) : helperText ? (
        <p id={helperId} className="mt-1.5 text-xs text-muted-foreground">
          {helperText}
        </p>
      ) : null}

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full max-w-[calc(100vw-2rem)] sm:max-w-none bg-white border border-border-subtle rounded-lg shadow-lg overflow-hidden focus:outline-none"
          onKeyDown={handleKeyDown}
        >
          {/* Search Field */}
          <div className="p-2 border-b border-border-subtle bg-slate-50/50">
            <div className="relative flex items-center">
              <span
                className="absolute left-2.5 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search contacts..."
                aria-label="Search contacts"
                className="w-full h-8 pl-8 pr-3 text-xs bg-white rounded-md border border-border-subtle text-foreground-dark placeholder-muted-foreground focus:outline-none focus:ring-0 focus:border-brand"
              />
            </div>
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-label={label ?? "Contact options"}
            className="max-h-60 overflow-y-auto py-1 divide-y divide-slate-50 focus:outline-none"
          >
            {isLoading ? (
              <li className="px-3 py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <svg
                  className="w-3.5 h-3.5 animate-spin text-brand"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                <span>Loading contacts...</span>
              </li>
            ) : fetchError ? (
              <li className="px-3 py-4 text-center text-xs text-red-600 space-y-2">
                <p>{fetchError}</p>
                <button
                  type="button"
                  onClick={() => fetchRemoteContacts(searchQuery)}
                  className="px-2.5 py-1 text-xs rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </li>
            ) : activeOptions.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                <span>No contacts found for this customer.</span>
              </li>
            ) : (
              activeOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3.5 py-2.5 flex items-center justify-between text-xs sm:text-sm cursor-pointer transition-colors select-none ${
                      isSelected
                        ? "bg-blue-50 text-brand font-medium"
                        : isHighlighted
                        ? "bg-slate-50 text-foreground-dark"
                        : "text-foreground-dark hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-medium">{opt.label}</div>
                      {opt.sublabel && (
                        <div className="text-xs text-muted-foreground truncate">
                          {opt.sublabel}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <span className="text-brand shrink-0" aria-hidden="true">
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
