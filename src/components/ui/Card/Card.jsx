import { forwardRef } from "react";
import { cn } from "../../../lib/cn";

const toneClassMap = {
  default: "",
  accent: "ui-card--accent",
  success: "ui-card--success",
  warning: "ui-card--warning",
  neutral: "ui-card--neutral",
};

export const Card = forwardRef(function Card(
  {
    as = "article",
    href,
    type = "button",
    interactive = false,
    compact = false,
    tone = "default",
    selected = false,
    hovered = false,
    focused = false,
    disabled = false,
    className,
    children,
    ...props
  },
  ref
) {
  const Element = href ? "a" : as;
  const isActionElement = Element === "a" || Element === "button";
  const isInteractive = interactive || isActionElement;
  const classNames = cn(
    "ui-card",
    toneClassMap[tone],
    isInteractive && "ui-card--interactive",
    compact && "ui-card--compact",
    selected && "ui-card--selected",
    hovered && "is-hovered",
    focused && "is-focused",
    disabled && "is-disabled",
    className
  );

  if (Element === "a") {
    return (
      <a ref={ref} className={classNames} href={disabled ? undefined : href} aria-disabled={disabled || undefined} {...props}>
        {children}
      </a>
    );
  }

  if (Element === "button") {
    return (
      <button ref={ref} className={classNames} type={type} disabled={disabled} {...props}>
        {children}
      </button>
    );
  }

  return (
    <Element ref={ref} className={classNames} {...props}>
      {children}
    </Element>
  );
});
