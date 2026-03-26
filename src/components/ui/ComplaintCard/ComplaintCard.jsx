import { useState } from "react";
import { Badge } from "../Badge/Badge";
import { Card } from "../Card/Card";
import { ConfirmActionSelect } from "../ConfirmActionSelect/ConfirmActionSelect";
import { cn } from "../../../lib/cn";

function normalizeMetaItem(item) {
  if (item == null) {
    return null;
  }

  if (typeof item === "string") {
    return { label: item };
  }

  if (typeof item === "object" && item.label) {
    return item;
  }

  return null;
}

export function ComplaintCard({
  eyebrow = "Жалоба",
  size = "lg",
  title,
  meta = [],
  description,
  count,
  actionOptions = [],
  actionValue,
  defaultActionValue,
  onActionChange,
  getActionConfirmation,
  actionPlaceholder,
  actionDisabled = false,
  actionClassName,
  className,
  ...props
}) {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const normalizedMeta = meta.map(normalizeMetaItem).filter(Boolean);
  const resolvedDefaultActionValue = defaultActionValue ?? actionOptions[0]?.value ?? "";
  const hasAction = actionOptions.length > 0 || actionPlaceholder;

  return (
    <Card className={cn("ui-complaint-card", size === "md" && "ui-complaint-card--md", isActionMenuOpen && "ui-complaint-card--menu-open", className)} {...props}>
      <div className="ui-complaint-card__top">
        {eyebrow ? <Badge className="ui-complaint-card__eyebrow">{eyebrow}</Badge> : <span aria-hidden="true" />}
        {count != null ? (
          <span className="ui-complaint-card__count" aria-label={`Количество жалоб: ${count}`}>
            {count}
          </span>
        ) : null}
      </div>

      <div className="ui-complaint-card__content">
        {title ? <h3 className={cn(size === "md" ? "ui-type-h3" : "ui-type-h2", "ui-complaint-card__title")}>{title}</h3> : null}

        {normalizedMeta.length ? (
          <div className="ui-complaint-card__meta">
            {normalizedMeta.map((item, index) => (
              <Badge key={`${item.label}-${index}`} className="ui-complaint-card__meta-badge">
                {item.label}
              </Badge>
            ))}
          </div>
        ) : null}

        {description ? <p className={cn("ui-type-body", "ui-complaint-card__description")}>{description}</p> : null}
      </div>

      {hasAction ? (
        <ConfirmActionSelect
          split
          onOpenChange={setIsActionMenuOpen}
          shellClassName="ui-complaint-card__action-shell"
          className={cn("ui-complaint-card__action", actionClassName)}
          toggleClassName="ui-complaint-card__action-toggle"
          options={actionOptions}
          value={actionValue}
          defaultValue={actionValue === undefined ? resolvedDefaultActionValue : undefined}
          onConfirm={onActionChange}
          getConfirmation={(option) => ({
            title: "Вы уверены?",
            description: title ? `Действие «${option.label}» будет применено к жалобе «${title}».` : `Действие «${option.label}» будет применено к жалобе.`,
            ...(getActionConfirmation?.(option) ?? {}),
          })}
          disabled={actionDisabled}
        />
      ) : null}
    </Card>
  );
}
