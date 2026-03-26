import { cn } from "../../../lib/cn";
import { Button } from "../Button/Button";
import { Tag } from "../Tag/Tag";

export function DashboardQueueCard({
  item,
  badge,
  dateLabel,
  title,
  description,
  actionHref,
  actionLabel,
  actionVariant,
  actionDisabled = false,
  onActionClick,
  className,
  ...props
}) {
  const resolvedItem = item ?? {};
  const resolvedBadge = badge ?? resolvedItem.badge;
  const resolvedDateLabel = dateLabel ?? resolvedItem.dateLabel;
  const resolvedTitle = title ?? resolvedItem.title;
  const resolvedDescription = description ?? resolvedItem.description;
  const resolvedActionHref = actionHref ?? resolvedItem.actionHref;
  const resolvedOnActionClick = onActionClick ?? resolvedItem.onActionClick;
  const resolvedActionLabel = actionLabel ?? resolvedItem.actionLabel ?? "Подробнее";
  const resolvedActionVariant = actionVariant ?? resolvedItem.actionVariant ?? "primary";
  const hasAction = Boolean(resolvedActionHref || resolvedOnActionClick);

  return (
    <article className={cn("ui-dashboard-queue-card", className)} {...props}>
      <div className="ui-dashboard-queue-card__top">
        {resolvedBadge ? <Tag className="ui-dashboard-queue-card__badge">{resolvedBadge}</Tag> : null}
        {resolvedDateLabel ? <span>{resolvedDateLabel}</span> : null}
      </div>

      <div className="ui-dashboard-queue-card__bottom">
        <div className="ui-dashboard-queue-card__copy">
          {resolvedTitle ? <h3 className="ui-type-h3">{resolvedTitle}</h3> : null}
          {resolvedDescription ? <p className="ui-type-body">{resolvedDescription}</p> : null}
        </div>

        {hasAction ? (
          <Button
            href={resolvedActionHref}
            variant={resolvedActionVariant}
            disabled={actionDisabled}
            onClick={resolvedActionHref ? undefined : resolvedOnActionClick}
            className="ui-dashboard-queue-card__action"
          >
            {resolvedActionLabel}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
