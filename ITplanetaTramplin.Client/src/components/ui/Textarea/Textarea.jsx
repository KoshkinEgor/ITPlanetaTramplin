import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { cn } from "../../../lib/cn";

export const Textarea = forwardRef(function Textarea(
  {
    value,
    defaultValue = "",
    onChange,
    onClear,
    onValueChange,
    clearable = false,
    clearLabel = "Clear textarea",
    clearText = "Clear",
    copyable = false,
    copyLabel = "Copy value",
    copyText = "Copy",
    copiedText = "Copied",
    copyValue,
    onCopy,
    showCount = false,
    countFormatter,
    focused = false,
    hovered = false,
    autoResize = false,
    resize = "vertical",
    shellClassName,
    className,
    style,
    disabled = false,
    readOnly = false,
    maxLength,
    ...props
  },
  ref
) {
  const textareaRef = useRef(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [hasCopied, setHasCopied] = useState(false);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const resolvedCopyValue = copyValue ?? currentValue;
  const currentLength = String(currentValue ?? "").length;
  const counterText = countFormatter
    ? countFormatter({ count: currentLength, maxLength })
    : typeof maxLength === "number"
      ? `${currentLength}/${maxLength}`
      : `${currentLength}`;
  const showClear = clearable && !disabled && !readOnly && Boolean(currentValue);
  const showCopy = copyable && !disabled && Boolean(resolvedCopyValue);
  const hasToolbar = showCount || showCopy || showClear;

  useImperativeHandle(ref, () => textareaRef.current);

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

  const adjustHeight = () => {
    if (!autoResize || !textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  };

  useLayoutEffect(() => {
    adjustHeight();
  }, [autoResize, currentValue]);

  const dispatchInputEvent = (nextValue) => {
    if (!textareaRef.current || typeof window === "undefined") {
      return false;
    }

    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");
    descriptor?.set?.call(textareaRef.current, nextValue);
    textareaRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  };

  const control = (
    <textarea
      ref={textareaRef}
      className={cn("ui-textarea", focused && "is-focused", hovered && "is-hovered", className)}
      style={{ resize: autoResize ? "none" : resize, ...style }}
      disabled={disabled}
      readOnly={readOnly}
      onChange={(event) => {
        if (!isControlled) {
          setInternalValue(event.target.value);
        }
        adjustHeight();
        onValueChange?.(event.target.value);
        onChange?.(event);
      }}
      value={currentValue}
      maxLength={maxLength}
      {...props}
    />
  );

  if (!hasToolbar) {
    return control;
  }

  return (
    <span className={cn("ui-textarea-shell", shellClassName)}>
      <span className="ui-textarea-shell__toolbar">
        <span className="ui-textarea-shell__meta">
          {showCount ? (
            <span className="ui-textarea-shell__count" aria-live="polite">
              {counterText}
            </span>
          ) : null}
        </span>
        {showCopy || showClear ? (
          <span className="ui-textarea-shell__actions">
            {showCopy ? (
              <button
                type="button"
                className={cn("ui-textarea-shell__action", hasCopied && "ui-textarea-shell__action--active")}
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
                  textareaRef.current?.focus();
                }}
              >
                {hasCopied ? copiedText : copyText}
              </button>
            ) : null}
            {showClear ? (
              <button
                type="button"
                className="ui-textarea-shell__action"
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
                  textareaRef.current?.focus();
                }}
              >
                {clearText}
              </button>
            ) : null}
          </span>
        ) : null}
      </span>
      {control}
    </span>
  );
});
