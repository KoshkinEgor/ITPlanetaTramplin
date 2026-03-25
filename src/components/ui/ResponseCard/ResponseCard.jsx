import { Button } from "../Button/Button";
import { Card } from "../Card/Card";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import { Tag } from "../Tag/Tag";
import { cn } from "../../../lib/cn";

function normalizeAction(action) {
  if (!action?.label) {
    return null;
  }

  return {
    variant: "secondary",
    accent: false,
    ...action,
  };
}

export function ResponseCard({
  name,
  subtitle,
  tags = [],
  description,
  status,
  statusTone = "info",
  primaryAction,
  secondaryAction,
  className,
}) {
  const actions = [normalizeAction(primaryAction), normalizeAction(secondaryAction)].filter(Boolean);

  return (
    <Card className={cn("ui-response-card", className)}>
      <div className="ui-response-card__header">
        <div className="ui-response-card__copy">
          <h3 className="ui-response-card__title">{name}</h3>
          {subtitle ? <p className="ui-response-card__subtitle">{subtitle}</p> : null}
        </div>

        {status ? (
          <StatusBadge tone={statusTone} className="ui-response-card__status">
            {status}
          </StatusBadge>
        ) : null}
      </div>

      {tags.length > 0 ? (
        <div className="ui-response-card__tags">
          {tags.map((tag, index) => (
            <Tag key={`${tag}-${index}`} className="ui-response-card__tag">
              {tag}
            </Tag>
          ))}
        </div>
      ) : null}

      {description ? <p className="ui-response-card__description">{description}</p> : null}

      {actions.length > 0 ? (
        <div className="ui-response-card__actions">
          {actions.map((action) => (
            <Button
              key={`${action.label}-${action.href ?? action.variant}`}
              href={action.href}
              variant={action.variant}
              className={cn("ui-response-card__action", action.accent && "ui-response-card__action--accent", action.className)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
