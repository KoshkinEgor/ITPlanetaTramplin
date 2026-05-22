import { cn } from "../../../lib/cn";
import { Tag } from "../Tag/Tag";

export function DashboardActivityCard({
  item,
  badge,
  timestamp,
  title,
  description,
  className,
  size = "md",
  ...props
}) {
  const resolvedItem = item ?? {};
  const isSmall = size === "sm";

  return (
    <article
      className={cn(
        "ui-dashboard-activity-card",
        isSmall && "ui-dashboard-activity-card--sm",
        className
      )}
      {...props}
    >
      <div className="ui-dashboard-activity-card__top">
        {(badge ?? resolvedItem.badge) ? (
          <Tag className="ui-dashboard-activity-card__badge">{badge ?? resolvedItem.badge}</Tag>
        ) : null}
        {(timestamp ?? resolvedItem.timestamp) ? <span>{timestamp ?? resolvedItem.timestamp}</span> : null}
      </div>

      <div className="ui-dashboard-activity-card__copy">
        {(title ?? resolvedItem.title) ? (
          <h3 className={isSmall ? "ui-type-body-lg" : "ui-type-h3"}>
            {title ?? resolvedItem.title}
          </h3>
        ) : null}
        {(description ?? resolvedItem.description) ? (
          <p className="ui-type-body">{description ?? resolvedItem.description}</p>
        ) : null}
      </div>
    </article>
  );
}
