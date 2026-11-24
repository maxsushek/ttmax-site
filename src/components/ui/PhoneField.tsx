"use client";

// src/components/ui/PhoneField.tsx
// Поле телефону — одне на весь сайт: оформлення замовлення, «Швидке замовлення», консультація.
//
// ⚠️ НАВІЩО (24.11.2026). Власник попросив той самий досвід, що у формі запису його проєкту
// sparkservice: приставка «+38» стоїть у полі й не редагується, далі маска «(0__) ___-__-__»,
// під полем — десять крапок, що заповнюються з кожною цифрою (3-3-2-2, як групи в номері),
// і підказка, яка каже, що робити далі, а на повному номері називає оператора. Логіка маски
// й перевірки — у utils/phone.ts (перенесена зі sparkservice й підсилена, див. коментарі там).
//
// Значення поля для батька — цифри «0XXXXXXXXX» (до десяти), а не текст із дужками: на
// сервер іде phoneE164(), у тексті показуємо phoneDisplay().
import { useId, type InputHTMLAttributes, type Ref } from "react";
import { cn } from "@/utils/cn";
import { keepPhoneCaret, phoneCheck, phoneDigits, phoneMask } from "@/utils/phone";
import {
  FIELD_INK,
  fieldBox,
  fieldCheck,
  fieldInput,
  fieldLabel,
  fieldLabelTone,
  fieldNote,
  type FieldState,
  type FieldTone,
} from "./fieldStyles";

const T = {
  ua: {
    empty: "Введіть номер мобільного оператора України",
    partial: "Введіть номер повністю",
    recognized: "номер розпізнано",
    badCode: "Перевірте код оператора — такого в Україні немає",
  },
  ru: {
    empty: "Введите номер мобильного оператора Украины",
    partial: "Введите номер полностью",
    recognized: "номер распознан",
    badCode: "Проверьте код оператора — такого в Украине нет",
  },
} as const;

/** Групи крапок — як групи цифр у номері: (067) 123-45-67. */
const DOT_GROUPS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7],
  [8, 9],
] as const;

type Props = {
  label: string;
  /** Цифри номера «0XXXXXXXXX» (див. phoneDigits у utils/phone.ts). */
  value: string;
  onChange: (digits: string) => void;
  locale: "ua" | "ru";
  required?: boolean;
  /** Помилка ззовні (після «Далі» чи надсилання) — показується замість живої підказки. */
  error?: string;
  onBlur?: () => void;
  tone?: FieldTone;
  /** Підпис лише для скрінрідера (форма консультації: підписи там сховані). */
  hideLabel?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  /** Додаткові атрибути самого <input>: name, toolparamdescription (WebMCP) тощо. */
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "onBlur" | "type" | "id" | "className" | "placeholder"
  >;
};

export function PhoneField({
  label,
  value,
  onChange,
  locale,
  required,
  error,
  onBlur,
  tone = "dark",
  hideLabel,
  inputRef,
  inputProps,
}: Props) {
  const id = useId();
  const t = T[locale];
  const check = phoneCheck(value);
  const hasError = !!error;
  const state: FieldState =
    hasError || check.state === "invalid" ? "invalid" : check.state === "valid" ? "valid" : "idle";
  const filled = Math.min(value.length, 10);
  const complete = filled === 10;

  const ink = FIELD_INK[tone];
  const dotOff = tone === "dark" ? "bg-white/15" : "bg-black/15";
  const dotOn =
    complete && state === "valid"
      ? ink.okBg
      : complete && state === "invalid"
        ? ink.errBg
        : tone === "dark"
          ? "bg-ink"
          : "bg-bg-base";

  return (
    // pb-2.5: підказка під полем — видимий текст (у ui/Input там порожній рядок-відступ),
    // тож без нижнього поля вона злипалась би з підписом наступного поля.
    <div className="min-w-0 pb-2.5">
      <label htmlFor={id} className={hideLabel ? "sr-only" : fieldLabel}>
        <span className={cn("transition-colors", fieldLabelTone(state, tone))}>
          {label}
          {required && <span className="text-danger"> *</span>}
        </span>
      </label>

      <div className={fieldBox(state, tone)}>
        {/* Приставка — частина номера, яку не набирають: людина одразу бачить, з чого почати.
            Вона не входить у <input>, тож дотик до неї сам курсор не ставив (до 24.11 рамкою був
            сам <input>). mousedown без дії — щоб поле у фокусі не втрачало його й не показувало
            помилку неповного номера; фокус — у click: так iOS відкриває клавіатуру. */}
        <span
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const el = document.getElementById(id) as HTMLInputElement | null;
            if (!el) return;
            el.focus();
            el.setSelectionRange(el.value.length, el.value.length);
          }}
          className={cn(
            "cursor-text select-none pl-3.5 font-body text-[16px] font-semibold",
            tone === "dark" ? "text-ink" : "text-bg-base",
          )}
        >
          +38
        </span>
        <input
          {...inputProps}
          ref={inputRef}
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete={inputProps?.autoComplete ?? "tel"}
          placeholder="(0__) ___-__-__"
          value={phoneMask(value)}
          onChange={(e) => {
            const el = e.target;
            // Маска переписує значення на кожне натискання — курсор лишаємо там, де правили.
            keepPhoneCaret(el);
            // ⚠️ НАВІЩО: номер уже повний, а в нього дописали ще цифру (не замінили виділене).
            // Маска зсунула б цифри вправо й мовчки відкинула останню — вийшов би інший, але
            // формально правильний номер, а курсор став би ПЕРЕД новою цифрою: дві цифри,
            // набрані поспіль, лягали у зворотному порядку. Поводимось як поле з maxLength:
            // зайвого не приймаємо. Стан не міняємо — React сам поверне полю попереднє значення.
            // Вставка з буфера й автозаповнення сюди не потрапляють (інший inputType).
            const inputType = (e.nativeEvent as InputEvent).inputType ?? "";
            if (
              inputType === "insertText" &&
              value.length === 10 &&
              el.value.replace(/\D/g, "").length > 10
            )
              return;
            // ⚠️ НАВІЩО: у полі вставлений іноземний номер (стан не з «0», див. phoneDigits), і з
            // нього стирають. Девʼять цифр, що лишились, phoneDigits звів би до «0XXXXXXXXX»:
            // «+7 701 123 45 67» після ОДНОГО Backspace ставав «(077) 011-23-45» із зеленою
            // галочкою й «Київстар» — і замовлення пішло б із чужим номером (ревʼю 24.11.2026).
            // Чужий номер на український не переробляємо — очищаємо поле.
            if (value && !value.startsWith("0") && inputType.startsWith("delete")) {
              onChange("");
              return;
            }
            onChange(phoneDigits(el.value));
          }}
          onBlur={onBlur}
          aria-invalid={state === "invalid" || undefined}
          aria-required={required || undefined}
          aria-describedby={`${id}-note`}
          className={cn(fieldInput(tone), "pl-2 tabular-nums")}
        />
        <span aria-hidden className={fieldCheck(state === "valid", tone)}>
          ✓
        </span>
      </div>

      {/* Десять крапок — по одній на цифру. «Пружинка» при заповненні — та сама крива, що в
          sparkservice; повний номер фарбує ряд зеленим, номер із неіснуючим кодом — червоним. */}
      <div aria-hidden className="mt-2.5 flex items-center gap-[11px]">
        {DOT_GROUPS.map((group) => (
          <span key={group[0]} className="flex gap-[5px]">
            {group.map((i) => (
              <i
                key={i}
                className={cn(
                  "block h-[9px] w-[9px] rounded-full motion-reduce:transition-none",
                  "transition-[background-color,transform] duration-[250ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                  i < filled ? cn("scale-[1.12]", dotOn) : dotOff,
                )}
              />
            ))}
          </span>
        ))}
      </div>

      <div
        id={`${id}-note`}
        role={hasError ? "alert" : undefined}
        aria-live={hasError ? undefined : "polite"}
        className={cn(
          fieldNote,
          state === "invalid"
            ? cn("font-semibold", ink.err)
            : state === "valid"
              ? ink.ok
              : ink.muted,
        )}
      >
        {hasError ? (
          error
        ) : check.state === "valid" ? (
          <>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
                ink.okSoft,
              )}
            >
              ✓{check.operator ? ` ${check.operator}` : ""}
            </span>
            {t.recognized}
          </>
        ) : check.state === "invalid" ? (
          t.badCode
        ) : check.state === "partial" ? (
          t.partial
        ) : (
          t.empty
        )}
      </div>
    </div>
  );
}
