import { cn } from "../../../lib/cn";
import { Tag } from "../Tag/Tag";

export function DashboardSectionHeader({
  eyebrow,
  title,
  description,
  counter = null,
  counterLabel,
  className,
  ...props
}) {
  return (
    <div className={cn("ui-dashboard-section-header", className)} {...props}>
      {eyebrow ? (
        <Tag tone="accent" className="ui-dashboard-section-header__eyebrow">
          {eyebrow}
        </Tag>
      ) : null}

      <div className="ui-dashboard-section-header__top">
        <div className="ui-dashboard-section-header__copy">
          {title ? <h2 className="ui-type-h2">{title}</h2> : null}
          {description ? <p className="ui-type-body">{description}</p> : null}
        </div>

        {counter !== null && counter !== undefined ? (
          <span className="ui-dashboard-section-header__counter" aria-label={counterLabel}>
            {counter}
          </span>
        ) : null}
      </div>
    </div>
  );
}
