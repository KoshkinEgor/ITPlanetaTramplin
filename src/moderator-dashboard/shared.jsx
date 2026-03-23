import { Button, Card, PillButton, StatusBadge, Tag } from "../components/ui";
import { PortalHeader } from "../components/layout/PortalHeader";
import { cn } from "../lib/cn";
import { HEADER_NAV, MODERATOR_SUMMARY, SIDEBAR_ITEMS } from "./data";

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

function AlertIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 5.4v4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="13.7" r="1" fill="currentColor" />
      <path
        d="M10 2.8c4 0 7.2 3.2 7.2 7.2S14 17.2 10 17.2 2.8 14 2.8 10 6 2.8 10 2.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

const MODERATOR_ICON_BUTTONS = [
  { key: "favorites", label: "Избранное", icon: <HeartIcon /> },
  { key: "alerts", label: "Уведомления", icon: <AlertIcon /> },
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="6" stroke="currentColor" strokeWidth="1.9" />
      <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m6.7 6.7 6.6 6.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m13.3 6.7-6.6 6.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function StreamIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 8h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 12h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m16 10 3 2-3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ModeratorFrame({ activeKey, children }) {
  return (
    <main className="moderator-dashboard">
      <div className="moderator-dashboard__shell">
        <ModeratorHeader />
        <div className="moderator-layout">
          <aside className="moderator-layout__sidebar">
            <ModeratorSidebar activeKey={activeKey} />
          </aside>
          <div className="moderator-layout__content">{children}</div>
        </div>
      </div>
    </main>
  );
}

export function ModeratorHeader() {
  const navItems = HEADER_NAV.map((item) => ({
    key: item.label,
    label: item.label,
    href: item.href,
  }));
  const currentKey = HEADER_NAV.find((item) => item.active)?.label;

  return (
    <PortalHeader
      navItems={navItems}
      currentKey={currentKey}
      actionHref="../auth/login.html"
      actionLabel="Войти / Регистрация"
      iconButtons={MODERATOR_ICON_BUTTONS}
      className="moderator-header moderator-fade-up"
    />
  );
}

export function ModeratorSidebar({ activeKey }) {
  return (
    <Card className="moderator-sidebar moderator-fade-up moderator-fade-up--delay-1">
      <div className="moderator-sidebar__head">
        <p className="ui-type-body">Кабинет модератора</p>
      </div>

      <nav className="moderator-sidebar__menu" aria-label="Разделы кабинета">
        {SIDEBAR_ITEMS.map((item) =>
          item.href ? (
            <a
              key={item.key}
              href={item.href}
              className={`moderator-sidebar__link ${item.key === activeKey ? "is-active" : ""}`.trim()}
              aria-current={item.key === activeKey ? "page" : undefined}
            >
              {item.label}
            </a>
          ) : (
            <button key={item.key} type="button" className="moderator-sidebar__link">
              {item.label}
            </button>
          )
        )}
      </nav>

      <div className="moderator-sidebar__summary">
        <span className="ui-type-caption">{MODERATOR_SUMMARY.eyebrow}</span>
        <strong>{MODERATOR_SUMMARY.count}</strong>
        <p className="ui-type-body">{MODERATOR_SUMMARY.text}</p>
      </div>
    </Card>
  );
}

export function ModeratorPageIntro({ title, description }) {
  return (
    <section className="moderator-hero moderator-fade-up moderator-fade-up--delay-1">
      <Tag tone="accent">
        Кабинет модератора
      </Tag>
      <div className="moderator-hero__copy">
        <h1 className="ui-type-display">{title}</h1>
        {description ? <p className="ui-type-body-lg">{description}</p> : null}
      </div>
    </section>
  );
}

export function ModeratorMetricCard({ item, delayIndex }) {
  return (
    <Card className={`moderator-metric-card moderator-fade-up moderator-fade-up--delay-${delayIndex}`.trim()}>
      <div className="moderator-metric-card__top">
        <span className="moderator-metric-card__icon" aria-hidden="true">
          <StreamIcon />
        </span>
        <strong>{item.value}</strong>
      </div>
      <div className="moderator-metric-card__copy">
        <h2 className="ui-type-h3">{item.title}</h2>
        <p className="ui-type-body">{item.note}</p>
      </div>
    </Card>
  );
}

export function ModeratorSearchBar({ value, onChange, placeholder }) {
  return (
    <label className="moderator-search moderator-fade-up moderator-fade-up--delay-1">
      <span className="moderator-search__icon" aria-hidden="true">
        <SearchIcon />
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="moderator-search__control"
        placeholder={placeholder}
      />
      <button type="button" className="moderator-search__clear" aria-label="Очистить поиск" onClick={() => onChange("")}>
        <ClearIcon />
      </button>
    </label>
  );
}

export function ModeratorFilterPill({ active, label, onClick }) {
  return (
    <PillButton active={active} onClick={onClick} className="moderator-pill">
      {label}
    </PillButton>
  );
}

export function ModeratorSortControl() {
  return (
    <div className="moderator-panel__sort">
      <span>Сортировать по</span>
      <button type="button" className="moderator-sort-button">
        <span>Дате</span>
        <ChevronDownIcon />
      </button>
    </div>
  );
}

export function ModeratorStatusBadge({ label, tone = "pending" }) {
  return <StatusBadge label={label} statusKey={tone} className="moderator-status" />;
}

export function ModeratorMediaCard({ label }) {
  return (
    <article className="moderator-media-card" aria-hidden="true">
      <span className="moderator-media-card__glow moderator-media-card__glow--lime" />
      <span className="moderator-media-card__glow moderator-media-card__glow--blue" />
      <Tag className="moderator-media-card__badge">
        {label}
      </Tag>
    </article>
  );
}

export function ModeratorDecisionButton({ label, tone, active = false, onClick, className }) {
  return (
    <button
      type="button"
      className={cn("moderator-decision", `moderator-decision--${tone}`, active && "is-active", className)}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function ModeratorDecisionStack({ items, className }) {
  return (
    <div className={cn("moderator-decision-stack", className)}>
      {items.map((item) => (
        <ModeratorDecisionButton
          key={item.key ?? item.label}
          label={item.label}
          tone={item.tone}
          active={item.active}
          onClick={item.onClick}
          className={item.className}
        />
      ))}
    </div>
  );
}
