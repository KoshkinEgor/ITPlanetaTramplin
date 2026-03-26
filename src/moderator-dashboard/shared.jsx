import { DecisionButton, FilterPill, SearchBar, SidebarNav, SortControl, StatTile, StatusBadge, Tag } from "../shared/ui";
import { useBodyClass } from "../shared/lib/useBodyClass";
import { PortalHeader } from "../widgets/layout/PortalHeader/PortalHeader";
import { cn } from "../lib/cn";
import { HEADER_NAV, MODERATOR_SUMMARY, SIDEBAR_ITEMS } from "./config";
import "./moderator-dashboard.css";

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
  useBodyClass("moderator-dashboard-react-body");

  return (
    <main className="moderator-dashboard">
      <div className="moderator-dashboard__shell ui-page-shell">
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
  return (
    <PortalHeader
      navItems={HEADER_NAV}
      currentKey={undefined}
      actionHref="/auth/login"
      actionLabel="Войти / Регистрация"
      iconButtons={MODERATOR_ICON_BUTTONS}
      className="moderator-header moderator-fade-up"
    />
  );
}

export function ModeratorSidebar({ activeKey }) {
  const summary = (
    <>
      <span className="ui-type-caption">{MODERATOR_SUMMARY.eyebrow}</span>
      <strong>{MODERATOR_SUMMARY.count}</strong>
      <p className="ui-type-body">{MODERATOR_SUMMARY.text}</p>
    </>
  );

  return (
    <SidebarNav
      title="Кабинет модератора"
      items={SIDEBAR_ITEMS}
      activeKey={activeKey}
      summary={summary}
      className="moderator-sidebar moderator-fade-up moderator-fade-up--delay-1"
      headClassName="moderator-sidebar__head"
      menuClassName="moderator-sidebar__menu"
      linkClassName="moderator-sidebar__link"
      summaryClassName="moderator-sidebar__summary"
    />
  );
}

export function ModeratorMetricCard({ item, delayIndex }) {
  return (
    <StatTile
      icon={<StreamIcon />}
      value={item.value}
      title={item.title}
      note={item.note}
      className={`moderator-metric-card moderator-fade-up moderator-fade-up--delay-${delayIndex}`.trim()}
      topClassName="moderator-metric-card__top"
      iconClassName="moderator-metric-card__icon"
      copyClassName="moderator-metric-card__copy"
    />
  );
}

export function ModeratorSearchBar({ value, onChange, placeholder }) {
  return (
    <SearchBar
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      clearLabel="Очистить поиск"
      icon={<SearchIcon />}
      appearance="elevated"
      size="lg"
      className="moderator-search moderator-fade-up moderator-fade-up--delay-1"
    />
  );
}

export function ModeratorFilterPill({ active, label, onClick }) {
  return <FilterPill active={active} onClick={onClick} className="moderator-pill" label={label} />;
}

export function ModeratorSortControl() {
  return (
    <div className="moderator-panel__sort">
      <span>Сортировать по</span>
      <SortControl
        label="Сортировка"
        value="date"
        options={[{ value: "date", label: "Дате" }]}
        open={false}
        onOpenChange={() => {}}
        onSelect={() => {}}
        triggerClassName="moderator-sort-button"
        triggerLabel="Дате"
        endIcon={<ChevronDownIcon />}
      />
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
      <Tag className="moderator-media-card__badge">{label}</Tag>
    </article>
  );
}

export function ModeratorDecisionButton({ label, tone, active = false, onClick, className }) {
  return (
    <DecisionButton
      label={label}
      tone="neutral"
      active={active}
      onClick={onClick}
      className={cn("moderator-decision", `moderator-decision--${tone}`, className)}
    />
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
