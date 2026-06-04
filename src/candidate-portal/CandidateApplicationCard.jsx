import { buildOpportunityDetailRoute, routes } from "../app/routes";
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

        {item.employerNote ? (
          <div className="candidate-application-card__note">
            <strong>Комментарий организатора:</strong> {item.employerNote}
          </div>
        ) : null}
      </div>

      <div className="candidate-application-card__actions">
        <Button
          href={buildOpportunityDetailRoute(item.opportunityId)}
          variant="secondary"
          size="sm"
          className="candidate-application-card__action"
        >
          Подробнее
        </Button>

        <Button
          href={routes.candidate.messages}
          variant="secondary"
          size="sm"
          className="candidate-application-card__action"
        >
          Сообщения
        </Button>

        {item.canWithdraw ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={isPending}
            disabled={isPending}
            className="candidate-application-card__action candidate-application-card__action--warning"
            onClick={() => onWithdraw?.(item)}
          >
            {item.status === "invited" ? "Отклонить приглашение" : "Отменить отклик"}
          </Button>
        ) : null}

        {item.canConfirm ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
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
