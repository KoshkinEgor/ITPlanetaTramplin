import { forwardRef } from "react";
import { AppLink } from "../../../app/AppLink";
import { cn } from "../../../lib/cn";

const variantClassMap = {
  surface: "ui-icon-button--surface",
  accent: "ui-icon-button--accent",
  outline: "ui-icon-button--outline",
};

const sizeClassMap = {
  sm: "ui-icon-button--sm",
  md: "ui-icon-button--md",
  lg: "ui-icon-button--lg",
  xl: "ui-icon-button--xl",
  "2xl": "ui-icon-button--2xl",
};

export const IconButton = forwardRef(function IconButton(
  {
    as = "button",
    href,
    label,
    variant = "surface",
    size = "md",
    loading = false,
    active = false,
    hovered = false,
    focused = false,
    disabled = false,
    className,
    children,
    type = "button",
    ...props
  },
  ref
) {
  const Element = href ? "a" : as;
  const isDisabled = disabled || loading;
  const accessibleLabel = label ?? props["aria-label"];
  const classNames = cn(
    "ui-icon-button",
    variantClassMap[variant] ?? variantClassMap.surface,
    sizeClassMap[size] ?? sizeClassMap.md,
    active && "is-active",
    hovered && "is-hovered",
    focused && "is-focused",
    loading && "is-loading",
    isDisabled && "is-disabled",
    className
  );

  const content = (
    <span className="ui-icon-button__glyph" aria-hidden="true">
      {loading ? <span className="ui-icon-button__loader" /> : children}
    </span>
  );

  if (href) {
    if (isDisabled) {
      return (
        <a
          ref={ref}
          className={classNames}
          href={undefined}
          aria-label={accessibleLabel}
          aria-disabled
          aria-busy={loading || undefined}
          {...props}
        >
          {content}
        </a>
      );
    }

    return (
      <AppLink ref={ref} className={classNames} href={href} aria-label={accessibleLabel} aria-busy={loading || undefined} {...props}>
        {content}
      </AppLink>
    );
  }

  return (
    <Element
      ref={ref}
      className={classNames}
      type={type}
      disabled={isDisabled}
      aria-label={accessibleLabel}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </Element>
  );
});
