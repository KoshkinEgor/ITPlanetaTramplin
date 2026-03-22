import { cn } from "../../../lib/cn";

const kindClassMap = {
  badge: "ui-badge",
  chip: "ui-chip",
  tag: "ui-tag",
};

const toneClassMap = {
  badge: {
    success: "ui-badge--success",
    warning: "ui-badge--warning",
    danger: "ui-badge--danger",
  },
  chip: {
    accent: "ui-chip--accent",
  },
  tag: {
    success: "ui-tag--success",
    warning: "ui-tag--warning",
    danger: "ui-tag--danger",
  },
};

export function Badge({
  as = "span",
  href,
  kind = "badge",
  tone = "default",
  active = false,
  dot = false,
  iconStart,
  iconEnd,
  className,
  children,
  ...props
}) {
  const Element = href ? "a" : as;
  const baseClassName = kindClassMap[kind] ?? kindClassMap.badge;
  const toneClassName = toneClassMap[kind]?.[tone];

  return (
    <Element
      className={cn(baseClassName, toneClassName, kind === "chip" && active && "is-active", className)}
      href={href}
      {...props}
    >
      {dot ? <span className="ui-status-dot" aria-hidden="true" /> : null}
      {iconStart ? <span className="ui-status-icon" aria-hidden="true">{iconStart}</span> : null}
      <span>{children}</span>
      {iconEnd ? <span className="ui-status-icon" aria-hidden="true">{iconEnd}</span> : null}
    </Element>
  );
}
