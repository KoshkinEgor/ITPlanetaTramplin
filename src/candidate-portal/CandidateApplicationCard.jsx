import { buildOpportunityDetailRoute } from "../app/routes";
import { Button, Card, StatusBadge, Tag } from "../shared/ui";

function renderCompanyContact(contact) {
  if (!contact) {
    return "У компании нет публичных контактов";
  }

  return contact.label || contact.value || "Контакт компании";
}

export function CandidateApplicationCard({
  item,
  isPending = false,
  onWithdraw,
  onConfirm,
  onOpenSocialContext,
  onShareOpportunity,
}) {
  const preview = item.socialContextPreview ?? {
    companyContacts: [],
    networkCandidates: [],
    peerCount: 0,
    incomingShareCount: 0,
  };
  const primaryCompanyContact = preview.companyContacts[0] ?? null;

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

        <div className="candidate-application-card__social">
          <div className="candidate-application-card__social-group">
            <span className="candidate-application-card__social-label">Связаться с компанией</span>
            <p className="candidate-application-card__social-value">{renderCompanyContact(primaryCompanyContact)}</p>
          </div>

          <div className="candidate-application-card__social-group">
            <span className="candidate-application-card__social-label">Люди из вашей сети</span>
            {preview.networkCandidates.length ? (
              <div className="candidate-application-card__social-people">
                {preview.networkCandidates.map((person) => (
                  <Tag key={person.id} tone="accent">
                    {person.name}
                  </Tag>
                ))}
              </div>
            ) : (
              <p className="candidate-application-card__social-value">Пока нет релевантных контактов</p>
            )}
          </div>

          <div className="candidate-application-card__social-group">
            <span className="candidate-application-card__social-label">Другие откликнувшиеся</span>
            <p className="candidate-application-card__social-value">
              {preview.peerCount > 0 ? `${preview.peerCount} видимых peer` : "Пока нет видимых peers"}
            </p>
          </div>
        </div>
      </div>

      <div className="candidate-application-card__actions">
        <Button
          href={buildOpportunityDetailRoute(item.opportunityId)}
          variant="secondary"
          className="candidate-application-card__action"
        >
          Подробнее
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="candidate-application-card__action"
          onClick={() => onShareOpportunity?.(item)}
        >
          Поделиться возможностью
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="candidate-application-card__action"
          onClick={() => onOpenSocialContext?.(item)}
        >
          Все связи по отклику
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
