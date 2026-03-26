import { cn } from "../../../lib/cn";
import { Card } from "../Card/Card";
import { EmptyState } from "../EmptyState/EmptyState";
import { PillButton } from "../PillButton/PillButton";
import { SearchInput } from "../SearchInput/SearchInput";
import { Tag } from "../Tag/Tag";

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="6" stroke="currentColor" strokeWidth="1.9" />
      <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function ActivityLogItem({ item }) {
  return (
    <article className="ui-activity-log__item">
      <div className="ui-activity-log__item-top">
        {item.kind ? (
          <Tag
            tone={item.kindTone ?? "default"}
            variant={item.kindVariant ?? "surface"}
            className="ui-activity-log__item-kind"
          >
            {item.kind}
          </Tag>
        ) : null}

        {item.timestamp ? (
          <time className="ui-activity-log__item-time" dateTime={item.timestampValue ?? undefined}>
            {item.timestamp}
          </time>
        ) : null}
      </div>

      <div className="ui-activity-log__item-copy">
        {item.title ? <h3 className="ui-activity-log__item-title">{item.title}</h3> : null}
        {item.description ? <p className="ui-activity-log__item-description">{item.description}</p> : null}
      </div>
    </article>
  );
}

export function ActivityLog({
  label,
  title,
  description,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search log entries",
  searchClearLabel = "Очистить поиск",
  searchAriaLabel,
  filters = [],
  activeFilter,
  onFilterChange,
  items = [],
  emptyStateTitle = "Записей пока нет",
  emptyStateDescription = "Когда появятся новые события, они появятся в этой ленте.",
  className,
  ...props
}) {
  const hasSearch = searchValue !== undefined || typeof onSearchChange === "function";
  const hasFilters = filters.length > 0;

  return (
    <section className={cn("ui-activity-log-shell", className)} {...props}>
      {hasSearch ? (
        <SearchInput
          value={searchValue ?? ""}
          onValueChange={onSearchChange}
          placeholder={searchPlaceholder}
          clearLabel={searchClearLabel}
          appearance="elevated"
          size="lg"
          icon={<SearchIcon />}
          className="ui-activity-log__search"
          aria-label={searchAriaLabel ?? searchPlaceholder}
        />
      ) : null}

      {hasFilters ? (
        <div className="ui-activity-log__filters" role="group" aria-label="Log filters">
          {filters.map((filter) => (
            <PillButton
              key={filter.value}
              size="lg"
              active={filter.value === activeFilter}
              onClick={() => onFilterChange?.(filter.value)}
            >
              {filter.label}
            </PillButton>
          ))}
        </div>
      ) : null}

      <Card className="ui-activity-log">
        <div className="ui-activity-log__head">
          {label ? <Tag tone="accent" className="ui-activity-log__eyebrow">{label}</Tag> : null}

          <div className="ui-activity-log__copy">
            {title ? <h2 className="ui-type-h2">{title}</h2> : null}
            {description ? <p className="ui-type-body">{description}</p> : null}
          </div>
        </div>

        {items.length ? (
          <div className="ui-activity-log__list">
            {items.map((item) => (
              <ActivityLogItem key={item.id ?? item.title} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState title={emptyStateTitle} description={emptyStateDescription} tone="neutral" compact />
        )}
      </Card>
    </section>
  );
}
