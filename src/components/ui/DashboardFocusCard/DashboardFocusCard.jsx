import { cn } from "../../../lib/cn";
import { Card } from "../Card/Card";

export function DashboardFocusCard({
  item,
  title,
  description,
  countLabel,
  className,
  ...props
}) {
  const resolvedItem = item ?? {};

  return (
    <Card className={cn("ui-dashboard-focus-card", className)} {...props}>
      <div className="ui-dashboard-focus-card__copy">
        {(title ?? resolvedItem.title) ? <h3 className="ui-type-h3">{title ?? resolvedItem.title}</h3> : null}
        {(description ?? resolvedItem.description) ? <p className="ui-type-body">{description ?? resolvedItem.description}</p> : null}
      </div>

      {(countLabel ?? resolvedItem.countLabel) ? (
        <span className="ui-dashboard-focus-card__count">{countLabel ?? resolvedItem.countLabel}</span>
      ) : null}
    </Card>
  );
}
