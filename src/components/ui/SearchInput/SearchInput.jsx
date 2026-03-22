import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { cn } from "../../../lib/cn";

function DefaultSearchIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export const SearchInput = forwardRef(function SearchInput(
  {
    value,
    defaultValue = "",
    onChange,
    onClear,
    onValueChange,
    clearLabel = "Clear",
    clearable = true,
    icon = <DefaultSearchIcon />,
    iconPosition = "left",
    className,
    inputClassName,
    ...props
  },
  ref
) {
  const inputRef = useRef(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const hasIcon = iconPosition !== "none" && icon !== null;
  const showClear = clearable && Boolean(currentValue);
  const showIcon = hasIcon && !(showClear && iconPosition === "right");

  useImperativeHandle(ref, () => inputRef.current);

  const dispatchInputEvent = (nextValue) => {
    if (!inputRef.current || typeof window === "undefined") {
      return false;
    }

    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
    descriptor?.set?.call(inputRef.current, nextValue);
    inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  };

  return (
    <div className={cn("ui-search-input", className)}>
      {showIcon ? (
        <span
          className={cn(
            "ui-search-input__icon",
            iconPosition === "right" && "ui-search-input__icon--right"
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <input
        ref={inputRef}
        type="search"
        value={currentValue}
        className={cn(
          "ui-input",
          "ui-search-input__control",
          hasIcon && iconPosition === "left" && "ui-search-input__control--icon-left",
          hasIcon && iconPosition === "right" && "ui-search-input__control--icon-right",
          showClear && "ui-search-input__control--has-clear",
          inputClassName
        )}
        onChange={(event) => {
          if (!isControlled) {
            setInternalValue(event.target.value);
          }
          onValueChange?.(event.target.value);
          onChange?.(event);
        }}
        {...props}
      />
      {showClear ? (
        <button
          type="button"
          className="ui-search-input__clear"
          onClick={() => {
            const dispatched = Boolean(onChange) && dispatchInputEvent("");

            if (!dispatched && !isControlled) {
              setInternalValue("");
            }

            if (!dispatched) {
              onValueChange?.("");
            }

            onClear?.();
            inputRef.current?.focus();
          }}
        >
          {clearLabel}
        </button>
      ) : null}
    </div>
  );
});
