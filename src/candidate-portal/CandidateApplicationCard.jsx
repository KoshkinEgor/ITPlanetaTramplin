import { buildOpportunityDetailRoute } from "../app/routes";
import { Button, Card, StatusBadge, Tag } from "../shared/ui";

export function CandidateApplicationCard({
  item,
  isPending = false,
  onWithdraw,
  onConfirm,
}) {
  return (
    <Card className="candidate-application-card">
      <div className="candidate-application-card__head">
        <Tag className="candidate-application-card__type">{item.type}</Tag>
        <StatusBadge tone={item.statusTone} className="candidate-application-card__status">
          {item.statusLabel}
        </StatusBadge>
      </div>

      <div className="candidate-application-card__body">
        <div className="candidate-application-card__copy">
          <h3 className="candidate-application-card__title ui-type-h3">{item.title}</h3>
          <p className="candidate-application-card__meta ui-type-body">{item.company}</p>
        </div>

        <div className="candidate-application-card__details">
          {item.details.map((detail) => (
            <p key={detail} className="candidate-application-card__detail">
              {detail}
            </p>
          ))}
        </div>

        <p className="candidate-application-card__message">{item.description}</p>
      </div>

      <div className="candidate-application-card__actions">
        <Button
          href={buildOpportunityDetailRoute(item.opportunityId)}
          variant="secondary"
          className="candidate-application-card__action"
        >
          Подробнее
        </Button>

        {item.canWithdraw ? (
          <Button
            type="button"
            variant="secondary"
            loading={isPending}
            disabled={isPending}
            className="candidate-application-card__action candidate-application-card__action--warning"
            onClick={() => onWithdraw?.(item)}
          >
            Отменить отклик
          </Button>
        ) : null}

        {item.canConfirm ? (
          <Button
            type="button"
            variant="secondary"
            loading={isPending}
            disabled={isPending}
            className="candidate-application-card__action candidate-application-card__action--success"
            onClick={() => onConfirm?.(item)}
          >
            Подтвердить участие
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
