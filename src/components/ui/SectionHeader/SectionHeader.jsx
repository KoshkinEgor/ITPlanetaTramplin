import { cn } from "../../../lib/cn";

const sizeClassMap = {
  lg: "",
  md: "ui-section-header--medium",
  sm: "ui-section-header--compact",
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  compact = false,
  size = "lg",
  align = "start",
  divider = false,
  titleAs,
  className,
  ...props
}) {
  const TitleTag = titleAs || (size === "sm" || compact ? "h3" : "h2");
  const titleClassName = compact || size === "sm"
    ? "ui-type-h3"
    : "ui-type-h2";

  return (
    <div
      className={cn(
        "ui-section-header",
        sizeClassMap[size],
        compact && "ui-section-header--compact",
        align === "center" && "ui-section-header--centered",
        divider && "ui-section-header--divided",
        className
      )}
      {...props}
    >
      <div className="ui-section-header__copy">
        {eyebrow ? <span className="ui-section-header__eyebrow">{eyebrow}</span> : null}
        {title ? <TitleTag className={titleClassName}>{title}</TitleTag> : null}
        {description ? <p className="ui-type-body">{description}</p> : null}
      </div>
      {meta || actions ? (
        <div className="ui-section-header__meta">
          {meta}
          {actions}
        </div>
      ) : null}
    </div>
  );
}
