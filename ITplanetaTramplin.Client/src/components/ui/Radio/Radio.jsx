import { forwardRef } from "react";
import { cn } from "../../../lib/cn";

export const Radio = forwardRef(function Radio(
  { label, hint, className, controlClassName, children, hovered = false, focused = false, disabled = false, ...props },
  ref
) {
  return (
    <label className={cn("ui-check", disabled && "is-disabled", className)}>
      <input
        ref={ref}
        type="radio"
        disabled={disabled}
        className={cn("ui-radio", hovered && "is-hovered", focused && "is-focused", controlClassName)}
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
