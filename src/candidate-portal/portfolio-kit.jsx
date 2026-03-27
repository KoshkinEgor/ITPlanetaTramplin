import { useEffect, useId, useRef, useState } from "react";
import { AppLink } from "../app/AppLink";
import { Button, Card, EmptyState, IconButton, SegmentedControl, StatusBadge, Tag } from "../shared/ui";
import { CANDIDATE_PAGE_ROUTES, CANDIDATE_PORTFOLIO_TABS } from "./config";
import { CandidateSectionHeader, CandidateSegmentNav } from "./shared";

const DEFAULT_PORTFOLIO_TITLE = "\u0420\u0435\u0437\u044E\u043C\u0435 \u0438 \u043F\u043E\u0440\u0442\u0444\u043E\u043B\u0438\u043E";
const DEFAULT_RESUME_BADGE = "\u0420\u0435\u0437\u044E\u043C\u0435";
const DEFAULT_PROFILE_TITLE = "\u041F\u0440\u043E\u0444\u0438\u043B\u044C \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u0430";
const DEFAULT_PROFILE_DESCRIPTION = "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0444\u0438\u043B\u044F \u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442\u043E\u0435.";
const DEFAULT_PROFILE_ACTION_LABEL = "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435";
const DEFAULT_EMPTY_STATE_DESCRIPTION = "\u0420\u0430\u0437\u0434\u0435\u043B \u0437\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u0440\u0435\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u0430.";
const DEFAULT_PROJECT_ACTION_LABEL = "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435";
const PROJECT_PARTICIPANTS_LABEL = "\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 \u043F\u0440\u043E\u0435\u043A\u0442\u0430";
const PROJECT_COVER_ALT_PREFIX = "\u041E\u0431\u043B\u043E\u0436\u043A\u0430 \u043F\u0440\u043E\u0435\u043A\u0442\u0430";
const EMPTY_SKILLS_LABEL = "\u041D\u0430\u0432\u044B\u043A\u0438 \u043F\u043E\u043A\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u044B";
const DEFAULT_RESUME_MINI_TITLE = "\u0420\u0435\u0437\u044E\u043C\u0435 \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u0430";
const DEFAULT_RESUME_MINI_UPDATED_LABEL = "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0435 \u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435";
const DEFAULT_RESUME_MINI_EMPTY_UPDATED_VALUE = "\u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E";
const DEFAULT_RESUME_MINI_EMPTY_CITY = "\u0413\u043E\u0440\u043E\u0434 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D";
const DEFAULT_RESUME_MINI_EXPERIENCE = "\u041E\u043F\u044B\u0442: \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D";
const DEFAULT_RESUME_MINI_STATS_LABEL = "\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u0437\u0430 \u043D\u0435\u0434\u0435\u043B\u044E";
const DEFAULT_RESUME_MINI_VISIBILITY_LABEL = "\u0412\u0438\u0434\u0438\u043C\u043E\u0441\u0442\u044C \u0440\u0435\u0437\u044E\u043C\u0435";
const DEFAULT_RESUME_MINI_MENU_LABEL = "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0441 \u0440\u0435\u0437\u044E\u043C\u0435";
const DEFAULT_RESUME_MINI_PRIVATE_LABEL = "\u041D\u0435 \u0432\u0438\u0434\u043D\u043E \u043D\u0438\u043A\u043E\u043C\u0443";
const DEFAULT_RESUME_MINI_EMPLOYERS_LABEL = "\u0412\u0438\u0434\u043D\u043E \u0440\u0430\u0431\u043E\u0442\u043E\u0434\u0430\u0442\u0435\u043B\u044F\u043C";
const DEFAULT_RESUME_MINI_EDIT_LABEL = "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C";
const DEFAULT_RESUME_MINI_DELETE_LABEL = "\u0423\u0434\u0430\u043B\u0438\u0442\u044C";

function MoreHorizontalIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4.5 10a1.5 1.5 0 1 0 0-.001V10Zm5.5 0a1.5 1.5 0 1 0 0-.001V10Zm5.5 0a1.5 1.5 0 1 0 0-.001V10Z" fill="currentColor" />
    </svg>
  );
}

function formatResumeMiniCardDate(value) {
  if (!value) {
    return DEFAULT_RESUME_MINI_EMPTY_UPDATED_VALUE;
  }

  if (typeof value === "string" && /^\d{2}\.\d{2}\.\d{4}$/.test(value.trim())) {
    return value.trim();
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return String(value).trim() || DEFAULT_RESUME_MINI_EMPTY_UPDATED_VALUE;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function CandidateResumeMiniCardMenu({
  buttonLabel,
  editHref,
  editLabel,
  onEditClick,
  deleteLabel,
  onDeleteClick,
  onToggle,
}) {
  const rootRef = useRef(null);
  const menuId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleToggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    onToggle?.(nextOpen);
  };

  const handleEditClick = () => {
    setOpen(false);
    onEditClick?.();
  };

  const handleDeleteClick = () => {
    setOpen(false);
    onDeleteClick?.();
  };

  return (
    <div ref={rootRef} className="candidate-resume-mini-card__menu-shell">
      <IconButton
        type="button"
        label={buttonLabel}
        variant="surface"
        size="2xl"
        className="candidate-resume-mini-card__menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={handleToggle}
      >
        <MoreHorizontalIcon />
      </IconButton>

      {open ? (
        <div id={menuId} className="candidate-resume-mini-card__menu-panel" role="menu">
          {editHref ? (
            <AppLink href={editHref} className="candidate-resume-mini-card__menu-action" role="menuitem" onClick={handleEditClick}>
              {editLabel}
            </AppLink>
          ) : (
            <button type="button" className="candidate-resume-mini-card__menu-action" role="menuitem" onClick={handleEditClick}>
              {editLabel}
            </button>
          )}

          <button
            type="button"
            className="candidate-resume-mini-card__menu-action candidate-resume-mini-card__menu-action--danger"
            role="menuitem"
            onClick={handleDeleteClick}
          >
            {deleteLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function CandidatePortfolioSwitcher({
  value,
  title = DEFAULT_PORTFOLIO_TITLE,
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
  badgeLabel = DEFAULT_RESUME_BADGE,
  title = DEFAULT_PROFILE_TITLE,
  description = DEFAULT_PROFILE_DESCRIPTION,
  skills = [],
  actionHref = CANDIDATE_PAGE_ROUTES.resumeEditor,
  actionLabel = DEFAULT_PROFILE_ACTION_LABEL,
}) {
  return (
    <Card className="candidate-resume-panel">
      <div className="candidate-resume-panel__intro">
        <Tag tone="accent">{badgeLabel}</Tag>
        <h2 className="ui-type-h2">{title}</h2>
        <p className="ui-type-body">{description}</p>
      </div>

      <div className="candidate-resume-record__tags">
        {skills.length ? skills.map((skill) => <Tag key={skill}>{skill}</Tag>) : <Tag>{EMPTY_SKILLS_LABEL}</Tag>}
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
        <div className="candidate-page-stack">{items.map(renderItem)}</div>
      ) : (
        <EmptyState title={emptyText} description={DEFAULT_EMPTY_STATE_DESCRIPTION} compact tone="neutral" />
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

export function CandidateResumeMiniCard({
  title = DEFAULT_RESUME_MINI_TITLE,
  updatedAt,
  updatedAtLabel = DEFAULT_RESUME_MINI_UPDATED_LABEL,
  city = DEFAULT_RESUME_MINI_EMPTY_CITY,
  experience = DEFAULT_RESUME_MINI_EXPERIENCE,
  statsLabel = DEFAULT_RESUME_MINI_STATS_LABEL,
  stats = {},
  visibility = "private",
  visibilityLabel = DEFAULT_RESUME_MINI_VISIBILITY_LABEL,
  privateVisibilityLabel = DEFAULT_RESUME_MINI_PRIVATE_LABEL,
  employersVisibilityLabel = DEFAULT_RESUME_MINI_EMPLOYERS_LABEL,
  onVisibilityChange,
  showMenu = true,
  menuHref,
  editHref,
  editLabel = DEFAULT_RESUME_MINI_EDIT_LABEL,
  onEditClick,
  deleteLabel = DEFAULT_RESUME_MINI_DELETE_LABEL,
  onDeleteClick,
  menuLabel = DEFAULT_RESUME_MINI_MENU_LABEL,
  onMenuClick,
}) {
  const statValues = {
    impressions: Number.isFinite(Number(stats.impressions)) ? Number(stats.impressions) : 0,
    views: Number.isFinite(Number(stats.views)) ? Number(stats.views) : 0,
    invitations: Number.isFinite(Number(stats.invitations)) ? Number(stats.invitations) : 0,
  };
  const resolvedVisibility = visibility === "employers" ? "employers" : "private";
  const updatedLabel = `${updatedAtLabel}: ${formatResumeMiniCardDate(updatedAt)}`;
  const chips = [city, experience].filter(Boolean);
  const visibilityItems = [
    { value: "private", label: privateVisibilityLabel },
    { value: "employers", label: employersVisibilityLabel },
  ];
  const resolvedEditHref = editHref ?? menuHref;

  return (
    <article className="candidate-resume-mini-card">
      <div className="candidate-resume-mini-card__head">
        <div className="candidate-resume-mini-card__copy">
          <h3 className="candidate-resume-mini-card__title">{title}</h3>
          <p className="candidate-resume-mini-card__updated">{updatedLabel}</p>
        </div>

        {showMenu ? (
          <CandidateResumeMiniCardMenu
            buttonLabel={menuLabel}
            editHref={resolvedEditHref}
            editLabel={editLabel}
            onEditClick={onEditClick}
            deleteLabel={deleteLabel}
            onDeleteClick={onDeleteClick}
            onToggle={onMenuClick}
          />
        ) : null}
      </div>

      {chips.length ? (
        <div className="candidate-resume-mini-card__tags">
          {chips.map((chip) => (
            <Tag key={chip}>{chip}</Tag>
          ))}
        </div>
      ) : null}

      <div className="candidate-resume-mini-card__stats">
        <span className="candidate-resume-mini-card__stats-label">{statsLabel}</span>
        <div className="candidate-resume-mini-card__stats-values">
          <span>
            Показы <strong>{statValues.impressions}</strong>
          </span>
          <span aria-hidden="true">|</span>
          <span>
            Просмотры <strong>{statValues.views}</strong>
          </span>
          <span aria-hidden="true">|</span>
          <span>
            Приглашения <strong>{statValues.invitations}</strong>
          </span>
        </div>
      </div>

      <div className="candidate-resume-mini-card__visibility">
        <span>{visibilityLabel}</span>
        <SegmentedControl
          items={visibilityItems}
          value={resolvedVisibility}
          onChange={onVisibilityChange}
          ariaLabel={visibilityLabel}
          stretch
          className="candidate-resume-mini-card__visibility-control"
          itemClassName="candidate-resume-mini-card__visibility-control-item"
        />
        <div
          className="candidate-resume-mini-card__visibility-switch candidate-resume-mini-card__visibility-switch--legacy"
          role="group"
          aria-label={visibilityLabel}
          aria-hidden="true"
          hidden
        >
          <button
            type="button"
            className={`candidate-resume-mini-card__visibility-button${resolvedVisibility === "private" ? " is-active" : ""}`}
            aria-pressed={resolvedVisibility === "private"}
            onClick={() => onVisibilityChange?.("private")}
          >
            {privateVisibilityLabel}
          </button>
          <button
            type="button"
            className={`candidate-resume-mini-card__visibility-button${resolvedVisibility === "employers" ? " is-active" : ""}`}
            aria-pressed={resolvedVisibility === "employers"}
            onClick={() => onVisibilityChange?.("employers")}
          >
            {employersVisibilityLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

export function CandidatePortfolioProjectCard({
  item,
  actionHref = CANDIDATE_PAGE_ROUTES.projects,
  actionLabel = DEFAULT_PROJECT_ACTION_LABEL,
  variant = "default",
  className,
}) {
  const isMediaVariant = variant === "media";
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
  const cardClassName = ["candidate-project-card", isMediaVariant ? "candidate-project-card--media" : null, className].filter(Boolean).join(" ");
  const coverAlt = `${PROJECT_COVER_ALT_PREFIX} ${item.title}`;

  if (isMediaVariant) {
    return (
      <Card className={cardClassName}>
        <div className="candidate-project-card__body candidate-project-card__body--media">
          <h3 className="candidate-project-card__title candidate-project-card__title--media">{item.title}</h3>
        </div>

        <div className="candidate-project-card__media candidate-project-card__media--media">
          {item.coverImageUrl ? <img src={item.coverImageUrl} alt={coverAlt} loading="lazy" /> : null}
        </div>

        <Button as="a" href={actionHref} variant="secondary" width="full" className="candidate-project-card__action candidate-project-card__action--media">
          {actionLabel}
        </Button>
      </Card>
    );
  }

  return (
    <Card className={cardClassName}>
      {item.coverImageUrl ? (
        <div className="candidate-project-card__media">
          <img src={item.coverImageUrl} alt={coverAlt} loading="lazy" />
        </div>
      ) : null}

      <div className="candidate-project-card__head">
        <div className="candidate-project-card__badges">
          <Tag tone="accent">{item.type}</Tag>
          <StatusBadge tone={item.statusTone}>{item.status}</StatusBadge>
        </div>
      </div>

      <div className="candidate-project-card__body">
        <h3 className="ui-type-h3 candidate-project-card__title">{item.title}</h3>
        <p className="ui-type-body">{item.description}</p>
        <p className="candidate-project-card__role">{item.role}</p>
        {participants.length ? (
          <div className="candidate-project-card__participants" aria-label={PROJECT_PARTICIPANTS_LABEL}>
            {participants.map((participant, index) => (
              <div key={`${participant.name}-${participant.role}-${index}`} className="candidate-project-card__participant">
                <strong>{participant.name}</strong>
                {participant.role ? <span>{participant.role}</span> : null}
              </div>
            ))}
            {participantOverflow ? (
              <div className="candidate-project-card__participant candidate-project-card__participant--more">+{participantOverflow}</div>
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
