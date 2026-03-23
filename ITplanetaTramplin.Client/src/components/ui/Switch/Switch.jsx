import { forwardRef } from "react";
import { cn } from "../../../lib/cn";

export const Switch = forwardRef(function Switch(
  { label, hint, className, controlClassName, children, hovered = false, focused = false, disabled = false, ...props },
  ref
) {
  return (
    <label className={cn("ui-check", disabled && "is-disabled", className)}>
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        disabled={disabled}
        className={cn("ui-switch", hovered && "is-hovered", focused && "is-focused", controlClassName)}
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
