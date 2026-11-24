"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import {
  fieldBox,
  fieldCheck,
  fieldInput,
  fieldLabel,
  fieldLabelTone,
  fieldNote,
  type FieldState,
} from "./fieldStyles";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label: string;
  error?: string;
  optional?: boolean;
  optionalLabel?: string;
  value: string;
  onValueChange: (value: string) => void;
  onBlurValidate?: () => void;
};

/**
 * Текстове поле форми. Вигляд спільний із полем телефону (ui/PhoneField) — див. ui/fieldStyles:
 * рамка з кільцем у фокусі, галочка для чинного значення, червона рамка й текст для помилки.
 */
export function Input({
  label,
  error,
  optional,
  optionalLabel,
  value,
  onValueChange,
  onBlurValidate,
  className,
  id: idProp,
  required,
  ...rest
}: Props) {
  const reactId = useId();
  const id = idProp ?? reactId;
  const [touched, setTouched] = useState(false);
  // ⚠️ НАВІЩО без touched: помилку батько ставить лише після blur або спроби перейти далі.
  // Було `touched && !!error` — і якщо одразу натиснути «Далі», помилки не з'являлись зовсім:
  // кнопка мовчки «не працювала». 31.10.2026 покупець тричі натиснув її з порожньою формою
  // й пішов без замовлення (PostHog, checkout_error).
  const showError = !!error;
  const isValid = touched && !error && value.trim().length > 0;
  const state: FieldState = showError ? "invalid" : isValid ? "valid" : "idle";

  return (
    <div className="min-w-0">
      <label htmlFor={id} className={fieldLabel}>
        <span className={cn("transition-colors", fieldLabelTone(state))}>
          {label}
          {!optional && required && <span className="text-danger"> *</span>}
          {optional && <span className="font-normal text-ink-ghost"> — {optionalLabel}</span>}
        </span>
      </label>

      <div className={fieldBox(state)}>
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
          // required забирає компонент (малює зірочку) — до <input> він не доходив зовсім.
          aria-required={required || undefined}
          aria-describedby={showError ? `${id}-error` : undefined}
          className={cn(fieldInput(), "pl-3.5", className)}
        />
        <span aria-hidden className={fieldCheck(isValid)}>
          ✓
        </span>
      </div>

      <div
        id={`${id}-error`}
        role={showError ? "alert" : undefined}
        className={cn(fieldNote, "font-semibold text-danger")}
      >
        {error ?? "\u200B"}
      </div>
    </div>
  );
}
