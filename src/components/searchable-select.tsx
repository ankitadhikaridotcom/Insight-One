"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  options: SelectOption[];
  value: string | string[] | null | undefined;
  onChange: (value: any) => void;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  isMulti?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  isClearable?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  label,
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search...",
  isMulti = false,
  isLoading = false,
  isDisabled = false,
  isClearable = true,
  required = false,
  error,
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setHighlightedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q)) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [options, search]);

  const selectedOptions = useMemo(() => {
    if (isMulti) {
      const arr = Array.isArray(value) ? value : value ? [value] : [];
      return options.filter((opt) => arr.includes(opt.value));
    }
    return options.find((opt) => opt.value === value) || null;
  }, [options, value, isMulti]);

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;

    if (isMulti) {
      const current = Array.isArray(value) ? value : value ? [value] : [];
      const exists = current.includes(option.value);
      const next = exists ? current.filter((v) => v !== option.value) : [...current, option.value];
      onChange(next);
    } else {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled) return;
    onChange(isMulti ? [] : "");
  };

  const handleRemoveSingleTag = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled) return;
    if (Array.isArray(value)) {
      onChange(value.filter((v) => v !== val));
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isDisabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Main Select Button Target */}
      <div
        tabIndex={isDisabled ? -1 : 0}
        onClick={() => !isDisabled && setIsOpen((prev) => !prev)}
        className={[
          "flex min-h-[42px] w-full items-center justify-between rounded-xl border bg-white px-3.5 py-2 text-sm transition outline-none cursor-pointer",
          error
            ? "border-rose-400 bg-rose-50/20"
            : isOpen
            ? "border-slate-800 ring-2 ring-slate-800/10 shadow-sm"
            : "border-slate-200 hover:border-slate-300",
          isDisabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0 mr-2">
          {isMulti ? (
            Array.isArray(selectedOptions) && selectedOptions.length > 0 ? (
              selectedOptions.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200"
                >
                  {opt.icon && <span className="mr-0.5">{opt.icon}</span>}
                  <span>{opt.label}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveSingleTag(opt.value, e)}
                    className="hover:text-rose-600 ml-0.5"
                  >
                    ✕
                  </button>
                </span>
              ))
            ) : (
              <span className="text-slate-400 text-sm">{placeholder}</span>
            )
          ) : selectedOptions && !Array.isArray(selectedOptions) ? (
            <div className="flex items-center gap-2 truncate">
              {selectedOptions.icon && <span>{selectedOptions.icon}</span>}
              <span className="text-slate-900 font-medium truncate">{selectedOptions.label}</span>
              {selectedOptions.subLabel && (
                <span className="text-xs text-slate-400 truncate">({selectedOptions.subLabel})</span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 text-sm">{placeholder}</span>
          )}
        </div>

        {/* Clear & Chevron Controls */}
        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {isClearable && !isDisabled && ((isMulti && Array.isArray(value) && value.length > 0) || (!isMulti && value)) && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md p-1 hover:text-slate-700 hover:bg-slate-100 text-xs transition"
              title="Clear selection"
            >
              ✕
            </button>
          )}
          <span className={`text-xs transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}>
            ▼
          </span>
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}

      {/* Popover Menu with Integrated Search */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100 max-h-72 flex flex-col">
          {/* Search Input Field */}
          <div className="relative mb-2">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition"
              onClick={(e) => e.stopPropagation()}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 max-h-48">
            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading options...</div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = isMulti
                  ? Array.isArray(value) && value.includes(opt.value)
                  : value === opt.value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={[
                      "flex items-center justify-between rounded-xl px-3 py-2 text-xs transition cursor-pointer select-none",
                      opt.disabled ? "opacity-40 cursor-not-allowed" : "",
                      isSelected
                        ? "bg-slate-900 text-white font-semibold"
                        : isHighlighted
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                      {opt.subLabel && (
                        <span className={`text-[10px] truncate ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                          • {opt.subLabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <span className="ml-2 font-bold text-xs">✓</span>}
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 italic">No matching options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
