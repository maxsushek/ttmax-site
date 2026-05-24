"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label: string;
  error?: string;
  optional?: boolean;
  optionalLabel?: string;
  value: string;
  onValueChange: (value: string) => void;
  onBlurValidate?: () => void;
  showValidIcon?: boolean;
  successHint?: string;
};

export function Input({
  label,
  error,
  optional,
  optionalLabel,
  value,
  onValueChange,
  onBlurValidate,
  showValidIcon = true,
  successHint,
  className,
  id: idProp,
  required,
  ...rest
}: Props) {
  const reactId = useId();
  const id = idProp ?? reactId;
  const [touched, setTouched] = useState(false);
  const showError = touched && !!error;
  const isValid = touched && !error && value.length > 0;

  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center justify-between font-body text-xs font-medium"
      >
        <span
          className={cn(
            "transition-colors",
            showError ? "text-danger" : isValid ? "text-success" : "text-ink-muted",
          )}
        >
          {label}
          {!optional && required && <span className="text-danger"> *</span>}
          {optional && (
            <span className="font-normal text-ink-ghost"> — {optionalLabel}</span>
          )}
        </span>
        {isValid && showValidIcon && (
          <span className="font-bold text-success text-[11px] animate-slide-in">
            ✓ {successHint ?? "OK"}
          </span>
        )}
      </label>

      <div className="relative">
        <input
          {...rest}
          id={id}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onBlur={(e) => {
            setTouched(true);
            onBlurValidate?.();
            rest.onBlur?.(e);
          }}
          aria-invalid={showError || undefined}
          aria-describedby={showError ? `${id}-error` : undefined}
          className={cn(
            "w-full rounded-[10px] border-[1.5px] px-3.5 py-3 pr-10",
            "font-body text-[15px] text-ink outline-none transition-all duration-200",
            "placeholder:text-ink-ghost",
            showError
              ? "border-danger bg-danger/[0.05] focus:ring-2 focus:ring-danger/20"
              : isValid
                ? "border-success bg-success/[0.05] focus:ring-2 focus:ring-success/20"
                : "border-white/10 bg-white/[0.05] focus:border-accent/45 focus:ring-2 focus:ring-accent/20",
            className,
          )}
        />
        {showValidIcon && (isValid || showError) && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-base"
          >
            {isValid ? "✅" : "❌"}
          </span>
        )}
      </div>

      <div
        id={`${id}-error`}
        role={showError ? "alert" : undefined}
        className={cn(
          "mt-1 min-h-[16px] font-body text-[11px] leading-snug text-danger transition-opacity",
          showError ? "opacity-100" : "opacity-0",
        )}
      >
        {error ?? "\u200B"}
      </div>
    </div>
  );
}
