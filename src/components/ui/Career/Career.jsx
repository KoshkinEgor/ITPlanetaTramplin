import { AppLink } from "../../../app/AppLink";
import { useFavoriteOpportunity } from "../../../features/favorites/useFavoriteOpportunity";
import { normalizeOpportunityId } from "../../../features/favorites/storage";
import { Avatar } from "../Avatar/Avatar";
import { Button } from "../Button/Button";
import { Card } from "../Card/Card";
import { IconButton } from "../IconButton/IconButton";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import { Tag } from "../Tag/Tag";

function HeartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 16.2s-5.2-3.5-6.7-6.6C2.1 7.2 3.2 4.5 6 4.5c1.5 0 2.7.8 4 2.3 1.3-1.5 2.5-2.3 4-2.3 2.8 0 3.9 2.7 2.7 5.1-1.5 3.1-6.7 6.6-6.7 6.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 5v10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5 10h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function getInitials(name) {
  return String(name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "TR";
}

export function CareerStatsPanel({
  title,
  metaTitle,
  metaDescription,
  stats = [],
  description,
  cta,
  className,
  ...props
}) {
  return (
    <Card className={["ui-career-panel", "ui-career-stats-panel", className].filter(Boolean).join(" ")} {...props}>
      <div className="ui-career-panel__header">
        {title ? <h2 className="ui-career-panel__title ui-type-h2">{title}</h2> : null}
        {metaTitle || metaDescription ? (
          <div className="ui-career-panel__meta">
            {metaTitle ? <strong>{metaTitle}</strong> : null}
            {metaDescription ? <span>{metaDescription}</span> : null}
          </div>
        ) : null}
      </div>

      {stats.length ? (
        <div className="ui-career-panel__stats">
          {stats.map((item) => (
            <div
              key={`${item.label}-${item.value}`}
              className={["ui-career-panel__stat", item.tone === "success" && "ui-career-panel__stat--success"].filter(Boolean).join(" ")}
            >
              <strong className="ui-career-panel__stat-value">{item.value}</strong>
              <span className="ui-career-panel__stat-label ui-type-caption">{item.label}</span>
            </div>
          ))}
        </div>
      ) : null}

      {description ? <p className="ui-career-panel__description">{description}</p> : null}

      {cta?.label ? (
        <Button href={cta.href ?? "#"} variant={cta.variant ?? "secondary"} width="full" className="ui-career-stats-panel__action">
          {cta.label}
        </Button>
      ) : null}
    </Card>
  );
}

export function CareerSkillsPanel({
  title,
  description = "У тебя уже есть хороший базовый набор. Развивай смежные навыки, чтобы увереннее перейти на следующий уровень.",
  primarySkills = [],
  suggestedSkills = [],
  href = "#",
  actionLabel = "Курсы по рекомендованным навыкам →",
  className,
  ...props
}) {
  return (
    <Card className={["ui-career-panel", "ui-career-skills-panel", className].filter(Boolean).join(" ")} {...props}>
      <div className="ui-career-panel__header">
        {title ? <h3 className="ui-career-panel__title ui-type-h2">{title}</h3> : null}
      </div>

      <div className="ui-career-panel__skill-cloud">
        {primarySkills.map((skill) => (
          <Tag key={skill} tone="accent" variant="soft">
            {skill}
          </Tag>
        ))}
      </div>

      <p className="ui-career-panel__description ui-type-txt">{description}</p>

      <div className="ui-career-panel__recommended ui-type-txt-select">
        <span className="ui-career-panel__recommended-title">Рекомендованные навыки</span>
        <div className="ui-career-panel__skill-cloud">
          {suggestedSkills.map((skill) => (
            <Tag key={skill} variant="surface">
              {skill}
            </Tag>
          ))}
        </div>
      </div>

      <a href={href} className="ui-career-panel__link">
        {actionLabel}
      </a>
    </Card>
  );
}

export function CareerSalaryPanel({ title, city, items = [], className, ...props }) {
  const resolvedTitle = city ? `${title} в ${city}` : title;

  return (
    <Card className={["ui-career-panel", "ui-career-salary-panel", className].filter(Boolean).join(" ")} {...props}>
      <div className="ui-career-panel__header">
        {resolvedTitle ? <h3 className="ui-career-salary-panel__title ui-type-h2">{resolvedTitle}</h3> : null}
      </div>

      <div className="ui-career-salary-panel__list">
        {items.map((item, index) => {
          const isHighlighted = item.highlighted ?? (index === items.length - 1 || Number(item.progress) >= 1);

          return (
            <div key={item.level} className={["ui-career-salary-panel__item", isHighlighted && "is-highlighted"].filter(Boolean).join(" ")}>
              <p className="ui-career-salary-panel__label ui-type-txt-select">{item.level}</p>
              <strong className="ui-career-salary-panel__value ui-type-h2">{item.range}</strong>
              <span className="ui-career-salary-panel__track" aria-hidden="true">
                <span style={{ width: `${Math.max(10, Math.round(Number(item.progress ?? 0) * 100))}%` }} />
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function CareerCourseCard({
  meta,
  title,
  provider,
  price,
  oldPrice,
  monthly,
  href = "#",
  actionLabel = "Перейти к курсу",
  actionTarget,
  actionRel,
  className,
  ...props
}) {
  return (
    <Card className={["ui-career-course-card", className].filter(Boolean).join(" ")} {...props}>
      <div className="ui-career-course-card__copy">
        {meta ? <p className="ui-career-course-card__meta">{meta}</p> : null}
        {title ? <h3 className="ui-career-course-card__title">{title}</h3> : null}
        {provider ? <p className="ui-career-course-card__provider">{provider}</p> : null}
        {price ? (
          <p className="ui-career-course-card__price">
            <strong>{price}</strong>
            {oldPrice ? <span>{oldPrice}</span> : null}
          </p>
        ) : null}
        {monthly ? <p className="ui-career-course-card__monthly">{monthly}</p> : null}
      </div>

      <Button
        href={href}
        target={actionTarget}
        rel={actionRel}
        variant="secondary"
        width="full"
        className="ui-career-course-card__action"
      >
        {actionLabel}
      </Button>
    </Card>
  );
}

export function CareerOpportunityCard({
  opportunityId,
  type,
  status,
  statusTone = "neutral",
  title,
  company,
  accent,
  chips = [],
  href = "#",
  actionLabel = "Подробнее",
  favoriteLabel = "Сохранить возможность",
  favoritePressed = false,
  onFavoriteClick,
  featured = false,
  className,
  ...props
}) {
  const { opportunityId: resolvedOpportunityId, isFavorite, toggleFavorite } = useFavoriteOpportunity(normalizeOpportunityId(opportunityId), favoritePressed);
  const handleFavoriteClick = () => {
    const nextState = toggleFavorite();
    onFavoriteClick?.(resolvedOpportunityId, nextState);
  };

  return (
    <Card
      className={["ui-career-opportunity-card", featured && "ui-career-opportunity-card--featured", className].filter(Boolean).join(" ")}
      data-opportunity-id={resolvedOpportunityId ?? undefined}
      {...props}
    >
      <div className="ui-career-opportunity-card__top">
        <div className="ui-career-opportunity-card__badges">
          {type ? <Tag variant="surface">{type}</Tag> : null}
          {status ? <StatusBadge tone={statusTone}>{status}</StatusBadge> : null}
        </div>

        <IconButton
          type="button"
          variant="surface"
          size="sm"
          className="ui-career-opportunity-card__save"
          label={favoriteLabel}
          aria-pressed={isFavorite}
          active={isFavorite}
          data-opportunity-id={resolvedOpportunityId ?? undefined}
          onClick={handleFavoriteClick}
        >
          <HeartIcon />
        </IconButton>
      </div>

      <div className="ui-career-opportunity-card__copy">
        {title ? <h3 className="ui-career-opportunity-card__title">{title}</h3> : null}
        {company ? <p className="ui-career-opportunity-card__company">{company}</p> : null}
        {accent ? <strong className="ui-career-opportunity-card__accent">{accent}</strong> : null}
      </div>

      {chips.length ? (
        <div className="ui-career-opportunity-card__chips">
          {chips.map((chip) => (
            <Tag key={chip} variant="surface" size="sm">
              {chip}
            </Tag>
          ))}
        </div>
      ) : null}

      <Button href={href} variant="secondary" width="full" className="ui-career-opportunity-card__action">
        {actionLabel}
      </Button>
    </Card>
  );
}

export function CareerMentorCard({
  name,
  role,
  summary,
  tone = "neutral",
  href = "#",
  imageUrl,
  actionLabel = "Профиль",
  onActionClick,
  className,
  ...props
}) {
  return (
    <Card className={["ui-career-mentor-card", className].filter(Boolean).join(" ")} {...props}>
      <div className="ui-career-mentor-card__body">
        <div className="ui-career-mentor-card__head">
          <Avatar src={imageUrl} name={name} initials={getInitials(name)} size="lg" tone={tone} className="ui-career-mentor-card__avatar" />
          <div className="ui-career-mentor-card__copy">
            {name ? <h3 className="ui-career-mentor-card__name">{name}</h3> : null}
            {role ? <p className="ui-career-mentor-card__role">{role}</p> : null}
          </div>
        </div>

        {summary ? <p className="ui-career-mentor-card__summary">{summary}</p> : null}
      </div>

      {typeof onActionClick === "function" ? (
        <Button type="button" variant="secondary" width="full" className="ui-career-mentor-card__action" onClick={onActionClick}>
          {actionLabel}
        </Button>
      ) : (
        <Button href={href} variant="secondary" width="full" className="ui-career-mentor-card__action">
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}

export function CareerPeerCard({
  name,
  initials,
  sharedSkills = [],
  profileHref = "",
  href = "#",
  actionLabel = "Добавить в контакты",
  className,
  userId: _userId,
  ...props
}) {
  const skillsLabel = sharedSkills.length
    ? `${sharedSkills.length} общих навыка: ${sharedSkills.join(", ")}`
    : "Общие навыки пока не найдены";
  const resolvedProfileHref = profileHref || href;

  return (
    <Card className={["ui-career-peer-card", className].filter(Boolean).join(" ")} {...props}>
      <AppLink href={resolvedProfileHref} className="ui-career-peer-card__main">
        <Avatar initials={initials || getInitials(name)} name={name} tone="warning" shape="rounded" className="ui-career-peer-card__avatar" />
        <div className="ui-career-peer-card__copy">
          {name ? <h3 className="ui-career-peer-card__name">{name}</h3> : null}
          <p className="ui-career-peer-card__skills">{skillsLabel}</p>
        </div>
      </AppLink>

      <IconButton href={href || resolvedProfileHref} label={actionLabel} size="lg" className="ui-career-peer-card__action">
        <PlusIcon />
      </IconButton>
    </Card>
  );
}
