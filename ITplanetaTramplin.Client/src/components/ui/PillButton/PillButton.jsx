import { forwardRef } from "react";
import { cn } from "../../../lib/cn";

export const PillButton = forwardRef(function PillButton(
  {
    as = "button",
    href,
    active = false,
    className,
    children,
    type = "button",
    ...props
  },
  ref
) {
  const Element = href ? "a" : as;
  const classNames = cn("ui-pill-button", active && "is-active", className);

  if (Element === "a") {
    return (
      <a
        ref={ref}
        href={href}
        className={classNames}
        aria-current={active ? "page" : undefined}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <Element
      ref={ref}
      type={type}
      className={classNames}
      aria-pressed={active || undefined}
      {...props}
    >
      {children}
    </Element>
  );
});
