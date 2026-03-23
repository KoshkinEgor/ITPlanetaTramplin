import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { cn } from "../../../lib/cn";

export const Input = forwardRef(function Input(
  {
    value,
    defaultValue = "",
    onChange,
    onClear,
    onValueChange,
    clearable = false,
    clearLabel = "Clear input",
    clearText = "Clear",
    copyable = false,
    copyLabel = "Copy value",
    copyText = "Copy",
    copiedText = "Copied",
    copyValue,
    onCopy,
    revealable = false,
    showPasswordLabel = "Show password",
    hidePasswordLabel = "Hide password",
    showPasswordText = "Show",
    hidePasswordText = "Hide",
    focused = false,
    hovered = false,
    addonStart,
    addonEnd,
    iconStart,
    iconEnd,
    shellClassName,
    className,
    disabled = false,
    type = "text",
    ...props
  },
  ref
) {
  const inputRef = useRef(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const startAdornment = addonStart ?? iconStart;
  const endAdornment = addonEnd ?? iconEnd;
  const hasStartAddon = addonStart !== undefined && addonStart !== null;
  const hasEndAddon = addonEnd !== undefined && addonEnd !== null;
  const hasStartAdornment = Boolean(startAdornment);
  const hasEndAdornment = Boolean(endAdornment);
  const showClear = clearable && !disabled && type !== "file" && Boolean(currentValue);
  const showPasswordToggle = revealable && type === "password" && !disabled && !showClear;
  const resolvedCopyValue = copyValue ?? currentValue;
  const showCopy = copyable && !disabled && type !== "password" && type !== "file" && Boolean(resolvedCopyValue) && !showClear && !showPasswordToggle;
  const hasEndAction = showClear || showPasswordToggle || showCopy;
  const resolvedType = showPasswordToggle && isPasswordVisible ? "text" : type;

  useImperativeHandle(ref, () => inputRef.current);

  useEffect(() => {
    if (!hasCopied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setHasCopied(false);
    }, 1600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hasCopied]);

  const dispatchInputEvent = (nextValue) => {
    if (!inputRef.current || typeof window === "undefined") {
      return false;
    }

    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
    descriptor?.set?.call(inputRef.current, nextValue);
    inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  };

  const control = (
    <input
      ref={inputRef}
      type={resolvedType}
      value={currentValue}
      disabled={disabled}
      className={cn("ui-input", focused && "is-focused", hovered && "is-hovered", className)}
      onChange={(event) => {
        if (!isControlled) {
          setInternalValue(event.target.value);
        }
        onValueChange?.(event.target.value);
        onChange?.(event);
      }}
      {...props}
    />
  );

  if (!hasStartAdornment && !hasEndAdornment && !hasEndAction) {
    return control;
  }

  return (
    <span
      className={cn(
        "ui-control-shell",
        hasStartAdornment && "ui-control-shell--has-start",
        hasStartAddon && "ui-control-shell--has-start-addon",
        hasEndAdornment && "ui-control-shell--has-end",
        hasEndAddon && "ui-control-shell--has-end-addon",
        hasEndAction && "ui-control-shell--has-action",
        hasEndAdornment && hasEndAction && "ui-control-shell--has-end-and-action",
        hasEndAddon && hasEndAction && "ui-control-shell--has-end-addon-and-action",
        shellClassName
      )}
    >
      {hasStartAdornment ? (
        <span className={cn(hasStartAddon ? "ui-control-shell__addon ui-control-shell__addon--start" : "ui-control-shell__icon")} aria-hidden="true">
          {startAdornment}
        </span>
      ) : null}
      {control}
      {hasEndAdornment ? (
        <span
          className={cn(
            hasEndAddon ? "ui-control-shell__addon ui-control-shell__addon--end" : "ui-control-shell__icon ui-control-shell__icon--end",
            !hasEndAddon && hasEndAction && "ui-control-shell__icon--with-action"
          )}
          aria-hidden="true"
        >
          {endAdornment}
        </span>
      ) : null}
      {showClear ? (
        <button
          type="button"
          className="ui-control-shell__action"
          aria-label={clearLabel}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
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
          {clearText}
        </button>
      ) : showCopy ? (
        <button
          type="button"
          className={cn("ui-control-shell__action", hasCopied && "ui-control-shell__action--active")}
          aria-label={copyLabel}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={async () => {
            const textToCopy = String(resolvedCopyValue);

            if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
              try {
                await navigator.clipboard.writeText(textToCopy);
              } catch {
                // Keep the optimistic UI update even if clipboard permissions are unavailable.
              }
            }

            setHasCopied(true);
            onCopy?.(textToCopy);
            inputRef.current?.focus();
          }}
        >
          {hasCopied ? copiedText : copyText}
        </button>
      ) : showPasswordToggle ? (
        <button
          type="button"
          className="ui-control-shell__action ui-control-shell__action--toggle"
          aria-label={isPasswordVisible ? hidePasswordLabel : showPasswordLabel}
          aria-pressed={isPasswordVisible}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => {
            setIsPasswordVisible((currentVisibility) => !currentVisibility);
            inputRef.current?.focus();
          }}
        >
          {isPasswordVisible ? hidePasswordText : showPasswordText}
        </button>
      ) : null}
    </span>
  );
});
