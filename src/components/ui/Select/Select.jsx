import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { cn } from "../../../lib/cn";

export const Select = forwardRef(function Select(
  {
    value,
    defaultValue = "",
    onChange,
    onValueChange,
    options = [],
    children,
    placeholder,
    clearable = false,
    clearLabel = "Clear selection",
    clearText = "Clear",
    focused = false,
    hovered = false,
    iconStart,
    shellClassName,
    className,
    disabled = false,
    ...props
  },
  ref
) {
  const selectRef = useRef(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const showClear = clearable && !disabled && currentValue !== "";

  useImperativeHandle(ref, () => selectRef.current);

  const dispatchChangeEvent = (nextValue) => {
    if (!selectRef.current || typeof window === "undefined") {
      return false;
    }

    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value");
    descriptor?.set?.call(selectRef.current, nextValue);
    selectRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  };

  const control = (
    <select
      ref={selectRef}
      value={currentValue}
      disabled={disabled}
      className={cn(
        "ui-select",
        focused && "is-focused",
        hovered && "is-hovered",
        iconStart && "ui-select--with-start-icon",
        showClear && "ui-select--with-action",
        currentValue === "" && placeholder && "ui-select--placeholder",
        className
      )}
      onChange={(event) => {
        if (!isControlled) {
          setInternalValue(event.target.value);
        }
        onValueChange?.(event.target.value);
        onChange?.(event);
      }}
      {...props}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {children ||
        options.map((option) => (
          <option key={option.value ?? option.label} value={option.value}>
            {option.label}
          </option>
        ))}
    </select>
  );

  if (!iconStart && !showClear) {
    return control;
  }

  return (
    <span
      className={cn(
        "ui-control-shell",
        iconStart && "ui-control-shell--has-start",
        showClear && "ui-control-shell--has-action",
        shellClassName
      )}
    >
      {iconStart ? (
        <span className="ui-control-shell__icon" aria-hidden="true">
          {iconStart}
        </span>
      ) : null}
      {control}
      {showClear ? (
        <button
          type="button"
          className="ui-control-shell__action"
          aria-label={clearLabel}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => {
            const dispatched = Boolean(onChange) && dispatchChangeEvent("");

            if (!dispatched && !isControlled) {
              setInternalValue("");
            }

            if (!dispatched) {
              onValueChange?.("");
            }

            selectRef.current?.focus();
          }}
        >
          {clearText}
        </button>
      ) : null}
    </span>
  );
});
