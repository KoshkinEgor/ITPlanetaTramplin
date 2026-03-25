import { forwardRef } from "react";
import { AppLink } from "../../../app/AppLink";
import { cn } from "../../../lib/cn";

const variantClassMap = {
  primary: "ui-button--primary",
  secondary: "ui-button--secondary",
  ghost: "ui-button--ghost",
  danger: "ui-button--danger",
  contrast: "ui-button--contrast",
};

const sizeClassMap = {
  sm: "ui-button--sm",
  md: "",
  lg: "ui-button--lg",
};

export const Button = forwardRef(function Button(
  {
    as = "button",
    href,
    variant = "primary",
    size = "md",
    loading = false,
    active = false,
    hovered = false,
    focused = false,
    disabled = false,
    iconStart,
    iconEnd,
    accentColor,
    className,
    children,
    type = "button",
    style,
    ...props
  },
  ref
) {
  const Element = href ? "a" : as;
  const isDisabled = disabled || loading;
  const inlineStyle = accentColor ? { ...style, "--ui-button-accent": accentColor } : style;
  const classNames = cn(
    "ui-button",
    variantClassMap[variant] ?? variantClassMap.primary,
    sizeClassMap[size],
    active && "is-active",
    hovered && "is-hovered",
    focused && "is-focused",
    loading && "is-loading",
    isDisabled && "is-disabled",
    className
  );

  const content = (
    <>
      {iconStart ? <span className="ui-button__icon">{iconStart}</span> : null}
      <span className="ui-button__label">{children}</span>
      {loading ? <span className="ui-button__loader" aria-hidden="true" /> : null}
      {iconEnd ? <span className="ui-button__icon">{iconEnd}</span> : null}
    </>
  );

  if (href) {
    if (isDisabled) {
      return (
        <a
          ref={ref}
          className={classNames}
          style={inlineStyle}
          href={undefined}
          aria-disabled
          aria-busy={loading || undefined}
          {...props}
        >
          {content}
        </a>
      );
    }

    return (
      <AppLink
        ref={ref}
        className={classNames}
        style={inlineStyle}
        href={href}
        aria-busy={loading || undefined}
        {...props}
      >
        {content}
      </AppLink>
    );
  }

  return (
    <Element ref={ref} className={classNames} style={inlineStyle} type={type} disabled={isDisabled} aria-busy={loading || undefined} {...props}>
      {content}
    </Element>
  );
});
