import { DecisionButton, FilterPill, SearchBar, SidebarNav, SortControl, StatTile, StatusBadge, Tag, AlertIcon, ChevronDownIcon, HeartIcon, SearchIcon, StreamIcon } from "../shared/ui";
import { useBodyClass } from "../shared/lib/useBodyClass";
import { routes } from "../app/routes";
import { PortalHeader } from "../widgets/layout/PortalHeader/PortalHeader";
import { cn } from "../lib/cn";
import { getModeratorSidebarItems, HEADER_NAV } from "./config";
import "./moderator-dashboard.css";
const MODERATOR_ICON_BUTTONS = [
  { key: "favorites", label: "Избранное", href: routes.favorites, icon: <HeartIcon /> },
  { key: "alerts", label: "Уведомления", icon: <AlertIcon /> },
];
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

  const sidebarItems = getModeratorSidebarItems();
  return (
    <SidebarNav
      title="Кабинет модератора"
      items={sidebarItems}
      activeKey={activeKey}
      className="moderator-sidebar moderator-fade-up moderator-fade-up--delay-1"
      headClassName="moderator-sidebar__head"
      menuClassName="moderator-sidebar__menu"
      linkClassName="moderator-sidebar__link"
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

