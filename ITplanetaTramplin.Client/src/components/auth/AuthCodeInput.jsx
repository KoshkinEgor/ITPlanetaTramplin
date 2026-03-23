import { useEffect, useMemo, useRef } from "react";
import { cn } from "../../lib/cn";

export function AuthCodeInput({ value = [], length = 4, autoFocus = true, className, onChange }) {
  const refs = useRef([]);
  const digits = useMemo(() => Array.from({ length }, (_, index) => String(value[index] ?? "").slice(0, 1)), [length, value]);

  useEffect(() => {
    if (autoFocus) {
      refs.current[0]?.focus();
    }
  }, [autoFocus]);

  const setDigit = (index, nextValue) => {
    const nextDigits = digits.slice();
    nextDigits[index] = nextValue;
    onChange?.(nextDigits);
  };

  return (
    <div className={cn("auth-code-group", className)} role="group" aria-label="Код подтверждения">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          className="auth-code-group__input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Цифра ${index + 1}`}
          value={digit}
          onChange={(event) => {
            const nextValue = event.target.value.replace(/\D/g, "").slice(0, 1);
            setDigit(index, nextValue);

            if (nextValue) {
              refs.current[index + 1]?.focus();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digit && index > 0) {
              refs.current[index - 1]?.focus();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();

            const pastedDigits = event.clipboardData
              .getData("text")
              .replace(/\D/g, "")
              .slice(0, length)
              .split("");

            if (!pastedDigits.length) {
              return;
            }

            const nextDigits = Array.from({ length }, (_, digitIndex) => pastedDigits[digitIndex] ?? digits[digitIndex] ?? "");
            onChange?.(nextDigits);

            const nextEmptyIndex = nextDigits.findIndex((entry) => !entry);
            refs.current[nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex]?.focus();
          }}
        />
      ))}
    </div>
  );
}
