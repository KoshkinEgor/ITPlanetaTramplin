import { cn } from "../../../lib/cn";

const toneClassMap = {
  default: "",
  success: "ui-empty-state--success",
  warning: "ui-empty-state--warning",
  neutral: "ui-empty-state--neutral",
};

export function EmptyState({
  icon,
  eyebrow,
  title,
  description,
  actions,
  className,
  children,
  align = "start",
  compact = false,
  tone = "default",
  ...props
}) {
  return (
    <section
      className={cn(
        "ui-empty-state",
        toneClassMap[tone],
        align === "center" && "ui-empty-state--centered",
        compact && "ui-empty-state--compact",
        className
      )}
      {...props}
    >
      {icon ? <div className="ui-empty-state__icon">{icon}</div> : null}
      <div className="ui-empty-state__copy">
        {eyebrow ? <span className="ui-type-overline">{eyebrow}</span> : null}
        {title ? <h3 className="ui-type-h3">{title}</h3> : null}
        {description ? <p className="ui-type-body">{description}</p> : null}
      </div>
      {children ? <div className="ui-empty-state__content">{children}</div> : null}
      {actions ? <div className="ui-empty-state__actions">{actions}</div> : null}
    </section>
  );
}
