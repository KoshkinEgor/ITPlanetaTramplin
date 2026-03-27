import "../styles/tokens.css";
import "../styles/globals.css";
import "../components/ui/index.css";
import { Avatar, Button, Card, FormField, Input, PillButton, SearchInput, SectionHeader, SegmentedControl, StatusBadge, Tag } from "../components/ui";
import { PortalHeader } from "../components/layout/PortalHeader";
import { cn } from "../lib/cn";
import {
  CANDIDATE_PAGE_ROUTES,
  CANDIDATE_PROFILE,
  CANDIDATE_SIDEBAR_ITEMS,
  CANDIDATE_STATS,
} from "./data";
import "./candidate-portal.css";

const CANDIDATE_HEADER_NAV = [
  { key: "opportunities", label: "Возможности", href: "../opportunities/opportunities-catalog.html" },
  { key: "career", label: "Карьера", href: CANDIDATE_PAGE_ROUTES.overview },
  { key: "about", label: "О платформе", href: "../home/index.html#about" },
];

function MailIcon() {
  return (
    <svg viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="m5.5 7 5.5 4.5L16.5 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
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

function MoreIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="4" cy="10" r="1.6" fill="currentColor" />
      <circle cx="10" cy="10" r="1.6" fill="currentColor" />
      <circle cx="16" cy="10" r="1.6" fill="currentColor" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m6 4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m4 7 6 6 6-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3.5v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="m5.5 9.5 2.5 3 2.5-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartLineIcon() {
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

export function CandidateFrame({ activeKey, hero, children }) {
  return (
    <main className="candidate-portal">
      <div className="candidate-portal__shell">
        <PortalHeader
          navItems={CANDIDATE_HEADER_NAV}
          currentKey="opportunities"
          actionHref={CANDIDATE_PAGE_ROUTES.overview}
          actionLabel="Профиль"
          className="candidate-portal__header"
        />

        <div className="candidate-portal__layout">
          <aside className="candidate-portal__sidebar">
            <CandidateSidebar activeKey={activeKey} />
          </aside>

          <div className="candidate-portal__content">
            {hero}
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

export function CandidateStandaloneFrame({ children }) {
  return (
    <main className="candidate-portal">
      <div className="candidate-portal__shell">
        <PortalHeader
          navItems={CANDIDATE_HEADER_NAV}
          currentKey="opportunities"
          actionHref={CANDIDATE_PAGE_ROUTES.overview}
          actionLabel="Профиль"
          className="candidate-portal__header"
        />

        <div className="candidate-portal__content candidate-portal__content--standalone">
          {children}
        </div>
      </div>
    </main>
  );
}

export function CandidateSidebar({ activeKey }) {
  return (
    <Card className="candidate-sidebar">
      <div className="candidate-sidebar__head">
        <p className="ui-type-body">Личный кабинет</p>
      </div>

      <nav className="candidate-sidebar__menu" aria-label="Разделы кабинета">
        {CANDIDATE_SIDEBAR_ITEMS.map((item) => (
          <a
            key={item.key}
            href={item.href}
            className={cn("candidate-sidebar__link", item.key === activeKey && "is-active")}
            aria-current={item.key === activeKey ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <CandidateProgressCard
        className="candidate-sidebar__summary"
        note="Чем полнее профиль, тем точнее рекомендации и отклики работодателей."
      />
    </Card>
  );
}

export function CandidateProfileHero({
  description = CANDIDATE_PROFILE.description,
  skills = CANDIDATE_PROFILE.skills,
  sideContent,
  className,
}) {
  const resolvedDescription = typeof description === "undefined" ? CANDIDATE_PROFILE.description : description;
  const resolvedSkills = Array.isArray(skills) ? skills : CANDIDATE_PROFILE.skills;
  const [firstName, ...restName] = CANDIDATE_PROFILE.name.split(" ");
  const lastName = restName.join(" ");
  const defaultAside = (
    <>
      <CandidateProgressCard className="candidate-hero__progress" />
      <CandidateStatTiles items={CANDIDATE_STATS} className="candidate-hero__stats" />
      <Button href={`${CANDIDATE_PAGE_ROUTES.settings}?section=settings-profile`} variant="secondary" className="candidate-hero__action candidate-hero__aside-action">
        {"\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043f\u0440\u043e\u0444\u0438\u043b\u044c"}
      </Button>
    </>
  );
  const resolvedAside = sideContent ?? defaultAside;

  return (
    <Card className={cn("candidate-hero", className)}>
      <div className="candidate-hero__cover">
        <button type="button" className="candidate-hero__cover-link">
          {"\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0448\u0430\u043f\u043a\u0443 \u043f\u0440\u043e\u0444\u0438\u043b\u044f"}
        </button>

        <div className="candidate-hero__cover-pills">
          <span className="candidate-hero__pill candidate-hero__pill--accent">
            {"\u041f\u0440\u043e\u0444\u0438\u043b\u044c \u0441\u043e\u0438\u0441\u043a\u0430\u0442\u0435\u043b\u044f"}
          </span>
          <span className="candidate-hero__pill candidate-hero__pill--status">
            <span className="candidate-hero__pill-icon" aria-hidden="true">
              <HeartLineIcon />
            </span>
            {CANDIDATE_PROFILE.onlineLabel}
          </span>
        </div>
      </div>

      <div className="candidate-hero__body">
        <div className="candidate-hero__main">
          <div className="candidate-hero__identity">
            <Avatar
              initials={CANDIDATE_PROFILE.initials}
              size="xl"
              shape="rounded"
              tone="neutral"
              className="candidate-hero__avatar"
            />

            <div className="candidate-hero__heading">
              <h1 className="ui-type-h1 candidate-hero__title">
                <span>{firstName}</span>
                {lastName ? <span>{lastName}</span> : null}
              </h1>
              <p className="ui-type-body-lg candidate-hero__meta">{CANDIDATE_PROFILE.meta}</p>
            </div>
          </div>

          {typeof resolvedDescription === "string" && resolvedDescription.trim() ? (
            <p className="ui-type-body candidate-hero__description">{resolvedDescription}</p>
          ) : null}

          {resolvedSkills.length ? (
            <div className="candidate-hero__skills">
              {resolvedSkills.map((skill) => (
                <Tag key={skill} tone="accent">
                  {skill}
                </Tag>
              ))}
            </div>
          ) : null}
        </div>

        <div className="candidate-hero__aside">{resolvedAside}</div>
      </div>
    </Card>
  );
}

export function CandidateProgressCard({ title = "Заполненность профиля", value = CANDIDATE_PROFILE.completion, note, className }) {
  return (
    <div className={cn("candidate-progress-card", className)}>
      <div className="candidate-progress-card__head">
        <span>{title}</span>
        <strong className="candidate-progress-card__value">
          <span>{value}</span>
          <span className="candidate-progress-card__value-mark">%</span>
        </strong>
      </div>
      <div className="candidate-progress-card__bar" aria-hidden="true">
        <span style={{ width: `${value}%` }} />
      </div>
      {note ? <p>{note}</p> : null}
    </div>
  );
}

export function CandidateStatTiles({ items = CANDIDATE_STATS, className }) {
  return (
    <div className={cn("candidate-stat-tiles", className)}>
      {items.map((item) => (
        <div key={item.label} className="candidate-stat-tiles__item">
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function CandidateActionCircle({ label, icon, tone = "accent", href }) {
  const className = cn("candidate-action-circle", tone === "accent" && "candidate-action-circle--accent");

  if (href) {
    return (
      <a href={href} className={className} aria-label={label}>
        {icon}
      </a>
    );
  }

  return (
    <button type="button" className={className} aria-label={label}>
      {icon}
    </button>
  );
}

export function CandidateContactCard({ contact, variant = "grid", className }) {
  if (variant === "compact") {
    return (
      <a href="../contacts/contact-profile.html" className={cn("candidate-contact-card", "candidate-contact-card--compact", className)}>
        <Avatar initials={contact.initials} shape="rounded" className="candidate-contact-card__avatar" />
        <div className="candidate-contact-card__copy">
          <strong>{contact.name}</strong>
          <span>{contact.summary}</span>
        </div>
        <CandidateActionCircle label="Добавить контакт" icon={<PlusIcon />} tone="neutral" />
      </a>
    );
  }

  return (
    <Card className={cn("candidate-contact-card", "candidate-contact-card--grid", className)}>
      <div className="candidate-contact-card__head">
        <Avatar initials={contact.initials} shape="rounded" className="candidate-contact-card__avatar" />
        <div className="candidate-contact-card__copy">
          <strong>{contact.name}</strong>
          <span>{contact.summary}</span>
        </div>
      </div>

      <div className="candidate-contact-card__tags">
        {contact.tags.map((tag) => (
          <Tag key={tag} tone="accent">
            {tag}
          </Tag>
        ))}
      </div>

      <div className="candidate-contact-card__actions">
        <Button as="a" href="../contacts/contact-profile.html" variant="secondary" className="candidate-contact-card__button">
          Рекомендовать возможность
        </Button>
        <CandidateActionCircle label="Написать контакт" icon={<MailIcon />} href="../contacts/contact-profile.html" />
      </div>
    </Card>
  );
}

export function CandidateProjectCard({ item }) {
  return (
    <Card className="candidate-project-card">
      <div className="candidate-project-card__head">
        <div className="candidate-project-card__badges">
          <Tag tone="accent">{item.type}</Tag>
          <StatusBadge tone={item.statusTone}>{item.status}</StatusBadge>
        </div>
      </div>

      <div className="candidate-project-card__body">
        <h3 className="ui-type-h1">{item.title}</h3>
        <p className="ui-type-body">{item.description}</p>
        <p className="candidate-project-card__role">{item.role}</p>
      </div>

      <div className="candidate-project-card__tags">
        {item.chips.map((chip) => (
          <Tag key={chip}>{chip}</Tag>
        ))}
      </div>

      <Button as="a" href={CANDIDATE_PAGE_ROUTES.projects} variant="secondary" className="candidate-project-card__action">
        Подробнее
      </Button>
    </Card>
  );
}

export function CandidateResponseCard({ item }) {
  return (
    <Card className="candidate-response-card">
      <div className="candidate-response-card__top">
        <Tag>{item.type}</Tag>
        <StatusBadge statusKey={item.statusKey}>{item.statusLabel}</StatusBadge>
      </div>

      <div className="candidate-response-card__body">
        <h3 className="ui-type-h1">{item.title}</h3>
        <p className="ui-type-body">{item.company}</p>
        <div className="candidate-response-card__details">
          {item.details.map((detail) => (
            <p key={detail}>{detail}</p>
          ))}
        </div>
        <p className="candidate-response-card__description">{item.description}</p>
      </div>

      <div className="candidate-response-card__actions">
        {item.actions.map((action) => (
          <Button
            key={action.label}
            as="a"
            href="../opportunities/opportunity-detail-card.html"
            variant={action.variant}
            className="candidate-response-card__action"
          >
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}

export function CandidatePreferenceCard({ panel, className }) {
  return (
    <Card className={cn("candidate-preference-card", className)}>
      <div className="candidate-preference-card__head">
        <Tag>{panel.eyebrow}</Tag>
        <h3 className="ui-type-h3">{panel.title}</h3>
      </div>

      <div className="candidate-preference-card__rows">
        {panel.rows.map((row) => (
          <button key={row.label} type="button" className="candidate-preference-card__row">
            <span>{row.label}: <strong>{row.value}</strong></span>
            <ChevronRightIcon />
          </button>
        ))}
      </div>

      <StatusBadge tone="success" className="candidate-preference-card__status">Обновлено 12 марта 2026</StatusBadge>
    </Card>
  );
}

export function CandidateSettingsPreviewCard({ section, className, isOpen = false, onToggle, children }) {
  const contentId = `candidate-settings-section-${section.id}`;
  const handleToggle = () => onToggle?.(section.id);

  return (
    <Card className={cn("candidate-settings-preview-card", isOpen && "is-open", className)}>
      <div className="candidate-settings-preview-card__head">
        <Tag>{section.eyebrow}</Tag>
        <button
          type="button"
          className="candidate-settings-preview-card__toggle"
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-controls={contentId}
        >
          <span className="candidate-settings-preview-card__title">
            <h3 className="ui-type-h2">{section.title}</h3>
            <span className="candidate-settings-preview-card__chevron" aria-hidden="true">
              <ChevronDownIcon />
            </span>
          </span>
        </button>
      </div>

      <div className="candidate-settings-preview-card__collapsed" hidden={isOpen}>
          <div className="candidate-settings-preview-card__body">
            <span className={cn("candidate-settings-preview-card__status", section.statusTone === "success" && "is-success")}>
              {section.status}
            </span>
            {section.summary ? <p className="candidate-settings-preview-card__summary">{section.summary}</p> : null}
          </div>

          <div className="candidate-settings-preview-card__actions">
            <Button
              variant="secondary"
              className="candidate-settings-preview-card__action"
              onClick={handleToggle}
              aria-expanded={isOpen}
              aria-controls={contentId}
            >
              {section.actionLabel ?? "Редактировать"}
            </Button>
          </div>
      </div>

      <div id={contentId} className="candidate-settings-preview-card__expanded" hidden={!isOpen} aria-hidden={!isOpen}>
          {children}
      </div>
    </Card>
  );
}

export function CandidateSectionHeader({ eyebrow, title, description, actions, className }) {
  return (
    <SectionHeader
      eyebrow={eyebrow}
      title={title}
      description={description}
      actions={actions}
      size="md"
      className={cn("candidate-section-header", className)}
    />
  );
}

export function CandidateSearchBar({ value, onChange, placeholder }) {
  return (
    <SearchInput
      value={value}
      onValueChange={onChange}
      placeholder={placeholder}
      clearLabel="Очистить поиск"
      className="candidate-search-bar"
    />
  );
}

export function CandidateSortButton({ label = "По новизне" }) {
  return (
    <button type="button" className="candidate-sort-button">
      <span>{label}</span>
      <SortIcon />
    </button>
  );
}

export function CandidateSegmentNav({ items, value, className }) {
  return <SegmentedControl items={items} value={value} className={cn("candidate-segment-nav", className)} stretch />;
}

export function CandidateFilterPill({ label, active = false, onClick, href, className }) {
  return (
    <PillButton
      href={href}
      active={active}
      onClick={onClick}
      className={cn("candidate-filter-pill", className)}
    >
      {label}
    </PillButton>
  );
}

export function CandidateSettingsFields({ section }) {
  return (
    <section className="candidate-settings-fields">
      <div className="candidate-settings-fields__head">
        <Tag>{section.eyebrow}</Tag>
        <h3 className="ui-type-h3">{section.title}</h3>
      </div>

      <div className="candidate-settings-fields__grid">
        <FormField label="Почта">
          <Input value={section.email} readOnly />
        </FormField>
        <FormField label="Пароль">
          <Input value={section.password} readOnly type="password" />
        </FormField>
      </div>

      <div className="candidate-settings-fields__subhead">Изменить пароль</div>

      <div className="candidate-settings-fields__grid">
        <FormField label="Старый пароль">
          <Input defaultValue="" placeholder="Введите текущий пароль" type="password" />
        </FormField>
        <FormField label="Новый пароль">
          <Input defaultValue="" placeholder="Введите новый пароль" type="password" />
        </FormField>
      </div>

      <div className="candidate-settings-fields__logins">
        <div className="candidate-settings-fields__subhead">Последние входы</div>
        {section.lastLogins.map((item) => (
          <button key={item} type="button" className="candidate-settings-fields__login">
            <span>{item}</span>
            <ChevronRightIcon />
          </button>
        ))}
      </div>

      <div className="candidate-settings-fields__actions">
        <Button>Сохранить</Button>
      </div>
    </section>
  );
}

export { MailIcon, MoreIcon };
