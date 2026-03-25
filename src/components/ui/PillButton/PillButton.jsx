import { forwardRef } from "react";
import { AppLink } from "../../../app/AppLink";
import { cn } from "../../../lib/cn";

export const PillButton = forwardRef(function PillButton(
  {
    as = "button",
    href,
    active = false,
    size = "md",
    className,
    children,
    type = "button",
    ...props
  },
  ref
) {
  const Element = href ? "a" : as;
  const classNames = cn("ui-pill-button", size === "lg" && "ui-pill-button--lg", active && "is-active", className);

  if (href) {
    return (
      <AppLink
        ref={ref}
        href={href}
        className={classNames}
        aria-current={active ? "page" : undefined}
        {...props}
      >
        {children}
      </AppLink>
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
