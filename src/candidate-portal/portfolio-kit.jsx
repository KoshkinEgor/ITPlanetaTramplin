import { Button, Card, EmptyState, StatusBadge, Tag } from "../shared/ui";
import { CANDIDATE_PAGE_ROUTES, CANDIDATE_PORTFOLIO_TABS } from "./config";
import { CandidateSectionHeader, CandidateSegmentNav } from "./shared";

export function CandidatePortfolioSwitcher({
  value,
  title = "Резюме и портфолио",
  items = CANDIDATE_PORTFOLIO_TABS,
}) {
  return (
    <Card className="candidate-switcher-card">
      <CandidateSectionHeader title={title} />
      <CandidateSegmentNav items={items} value={value} />
    </Card>
  );
}

export function CandidateResumeProfileCard({
  badgeLabel = "Резюме",
  title = "Профиль кандидата",
  description = "Описание профиля пока пустое.",
  skills = [],
  actionHref = CANDIDATE_PAGE_ROUTES.resumeEditor,
  actionLabel = "Редактировать данные",
}) {
  return (
    <Card className="candidate-resume-panel">
      <div className="candidate-resume-panel__intro">
        <Tag tone="accent">{badgeLabel}</Tag>
        <h2 className="ui-type-h2">{title}</h2>
        <p className="ui-type-body">{description}</p>
      </div>

      <div className="candidate-resume-record__tags">
        {skills.length ? (
          skills.map((skill) => <Tag key={skill}>{skill}</Tag>)
        ) : (
          <Tag>Навыки пока не указаны</Tag>
        )}
      </div>

      <div className="candidate-resume-panel__actions">
        <Button href={actionHref}>{actionLabel}</Button>
      </div>
    </Card>
  );
}

export function CandidateResumeSection({ title, emptyText, items, renderItem }) {
  return (
    <Card className="candidate-resume-panel">
      <div className="candidate-resume-panel__intro">
        <h2 className="ui-type-h2">{title}</h2>
      </div>

      {items.length ? (
        <div className="candidate-page-stack">
          {items.map(renderItem)}
        </div>
      ) : (
        <EmptyState title={emptyText} description="Раздел заполнится после реальных действий кандидата." compact tone="neutral" />
      )}
    </Card>
  );
}

export function CandidateResumeRecord({ title, description, meta }) {
  return (
    <article className="candidate-resume-record">
      <div className="candidate-resume-record__head">
        <div className="candidate-resume-record__copy-link">
          <h3 className="ui-type-h2">{title}</h3>
          {description ? <p className="ui-type-body">{description}</p> : null}
        </div>
      </div>
      {meta ? (
        <div className="candidate-resume-record__stats">
          <span>{meta}</span>
        </div>
      ) : null}
    </article>
  );
}

export function CandidatePortfolioProjectCard({
  item,
  actionHref = CANDIDATE_PAGE_ROUTES.projects,
  actionLabel = "Подробнее",
}) {
  const participants = Array.isArray(item.participants)
    ? item.participants
      .map((participant) => ({
        name: typeof participant?.name === "string" ? participant.name.trim() : "",
        role: typeof participant?.role === "string" ? participant.role.trim() : "",
      }))
      .filter((participant) => participant.name)
      .slice(0, 3)
    : [];
  const participantOverflow = Math.max((Array.isArray(item.participants) ? item.participants.length : 0) - participants.length, 0);

  return (
    <Card className="candidate-project-card">
      {item.coverImageUrl ? (
        <div className="candidate-project-card__media">
          <img src={item.coverImageUrl} alt={`Обложка проекта ${item.title}`} loading="lazy" />
        </div>
      ) : null}

      <div className="candidate-project-card__head">
        <div className="candidate-project-card__badges">
          <Tag tone="accent">{item.type}</Tag>
          <StatusBadge tone={item.statusTone}>{item.status}</StatusBadge>
        </div>
      </div>

      <div className="candidate-project-card__body">
        <h3 className="ui-type-h3">{item.title}</h3>
        <p className="ui-type-body">{item.description}</p>
        <p className="candidate-project-card__role">{item.role}</p>
        {participants.length ? (
          <div className="candidate-project-card__participants" aria-label="Участники проекта">
            {participants.map((participant, index) => (
              <div key={`${participant.name}-${participant.role}-${index}`} className="candidate-project-card__participant">
                <strong>{participant.name}</strong>
                {participant.role ? <span>{participant.role}</span> : null}
              </div>
            ))}
            {participantOverflow ? (
              <div className="candidate-project-card__participant candidate-project-card__participant--more">
                +{participantOverflow}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="candidate-project-card__tags">
        {item.chips.map((chip) => (
          <Tag key={chip}>{chip}</Tag>
        ))}
      </div>

      <Button as="a" href={actionHref} variant="secondary" width="full" className="candidate-project-card__action">
        {actionLabel}
      </Button>
    </Card>
  );
}
