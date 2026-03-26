import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { cn } from "../../../lib/cn";
import { getFontWeightClassName, getWidthClassName } from "../sharedProps";

export const Checkbox = forwardRef(function Checkbox(
  { label, hint, className, controlClassName, children, hovered = false, focused = false, fontWeight, indeterminate = false, width, disabled = false, ...props },
  ref
) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => inputRef.current);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label className={cn("ui-check", disabled && "is-disabled", getFontWeightClassName(fontWeight), getWidthClassName(width), className)}>
      <input
        ref={inputRef}
        type="checkbox"
        disabled={disabled}
        className={cn(
          "ui-checkbox",
          hovered && "is-hovered",
          focused && "is-focused",
          indeterminate && "is-indeterminate",
          controlClassName
        )}
        {...props}
      />
      <span className="ui-check__copy">
        {children || (
          <>
            {label ? <span className="ui-check__label">{label}</span> : null}
            {hint ? <span className="ui-check__hint">{hint}</span> : null}
          </>
        )}
      </span>
    </label>
  );
});
