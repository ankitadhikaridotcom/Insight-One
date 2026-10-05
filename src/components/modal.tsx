"use client";

import React, { useEffect } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "3xl",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog: Fixed Header + Scrollable Middle + Fixed Footer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${maxWidthClasses} rounded-[28px] border border-slate-200 bg-white shadow-2xl transition-all max-h-[90vh] flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150 overflow-hidden`}
      >
        {/* Fixed Header */}
        <div className="shrink-0 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-5 z-10">
          <div>
            <h2 id="modal-title" className="text-xl font-bold text-slate-900">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition ml-3"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Middle Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 overscroll-contain">
          {children}
        </div>

        {/* Fixed Footer (if provided) */}
        {footer && (
          <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-6 py-4 flex items-center justify-end gap-3 z-10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
