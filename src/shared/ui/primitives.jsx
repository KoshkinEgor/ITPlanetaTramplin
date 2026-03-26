import { useEffect, useMemo, useRef, useState } from "react";
import { AppLink } from "../../app/AppLink";
import { cn } from "../lib/cn";
import { Button } from "../../components/ui/Button/Button";
import { Card } from "../../components/ui/Card/Card";
import { PillButton } from "../../components/ui/PillButton/PillButton";
import { SearchInput } from "../../components/ui/SearchInput/SearchInput";

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SearchBar({ onChange, onValueChange, className, clearLabel = "Очистить поиск", ...props }) {
  return (
    <SearchInput
      onValueChange={onValueChange ?? onChange}
      clearLabel={clearLabel}
      className={cn("ui-search-bar", className)}
      {...props}
    />
  );
}

export function FilterPill({ label, count, icon, className, children, ...props }) {
  return (
    <PillButton className={cn("ui-filter-pill", className)} {...props}>
      {icon ? <span className="ui-filter-pill__icon" aria-hidden="true">{icon}</span> : null}
      <span className="ui-filter-pill__label">{children ?? label}</span>
      {typeof count === "number" && count > 0 ? <span className="ui-filter-pill__count">{count}</span> : null}
    </PillButton>
  );
}

export function SidebarNav({
  title,
  items = [],
  activeKey,
  summary,
  footer,
  className,
  headClassName,
  titleClassName,
  menuClassName,
  linkClassName,
  summaryClassName,
}) {
  return (
    <Card className={cn("ui-sidebar-nav", className)}>
      {title ? (
        <div className={cn("ui-sidebar-nav__head", headClassName)}>
          <p className={cn("ui-type-body", titleClassName)}>{title}</p>
        </div>
      ) : null}

      <nav className={cn("ui-sidebar-nav__menu", menuClassName)} aria-label="Разделы кабинета">
        {items.map((item) => {
          const linkClassNames = cn("ui-sidebar-nav__link", item.key === activeKey && "is-active", linkClassName);

          return item.href ? (
            <AppLink key={item.key ?? item.label} href={item.href} className={linkClassNames} aria-current={item.key === activeKey ? "page" : undefined}>
              {item.label}
            </AppLink>
          ) : (
            <button key={item.key ?? item.label} type="button" className={linkClassNames} aria-current={item.key === activeKey ? "page" : undefined}>
              {item.label}
            </button>
          );
        })}
      </nav>

      {summary ? <div className={cn("ui-sidebar-nav__summary", summaryClassName)}>{summary}</div> : null}
      {footer ? <div className="ui-sidebar-nav__footer">{footer}</div> : null}
    </Card>
  );
}

export function StatTile({
  icon,
  value,
  title,
  note,
  tone = "default",
  className,
  compact = true,
  topClassName,
  iconClassName,
  valueClassName,
  copyClassName,
}) {
  return (
    <Card compact={compact} className={cn("ui-stat-tile", tone !== "default" && `ui-stat-tile--${tone}`, className)}>
      <div className={cn("ui-stat-tile__top", topClassName)}>
        {icon ? <span className={cn("ui-stat-tile__icon", iconClassName)} aria-hidden="true">{icon}</span> : null}
        <strong className={cn("ui-stat-tile__value", valueClassName)}>{value}</strong>
      </div>
      {(title || note) ? (
        <div className={cn("ui-stat-tile__copy", copyClassName)}>
          {title ? <h3 className="ui-type-h3">{title}</h3> : null}
          {note ? <p className="ui-type-body">{note}</p> : null}
        </div>
      ) : null}
    </Card>
  );
}

export function HeroPanel({ eyebrow, title, description, actions, aside, className, children }) {
  return (
    <Card className={cn("ui-hero-panel", className)}>
      <div className="ui-hero-panel__main">
        {(eyebrow || title || description || actions) ? (
          <div className="ui-hero-panel__copy">
            {eyebrow ? <span className="ui-type-overline">{eyebrow}</span> : null}
            {title ? <h2 className="ui-type-h2">{title}</h2> : null}
            {description ? <p className="ui-type-body">{description}</p> : null}
            {actions ? <div className="ui-hero-panel__actions">{actions}</div> : null}
          </div>
        ) : null}
        {children}
      </div>
      {aside ? <aside className="ui-hero-panel__aside">{aside}</aside> : null}
    </Card>
  );
}

const decisionVariantMap = {
  accent: "primary",
  neutral: "secondary",
  danger: "danger",
};

export function DecisionButton({ label, tone = "neutral", active = false, className, children, ...props }) {
  return (
    <Button
      variant={decisionVariantMap[tone] ?? decisionVariantMap.neutral}
      className={cn("ui-decision-button", `ui-decision-button--${tone}`, active && "is-active", className)}
      {...props}
    >
      {children ?? label}
    </Button>
  );
}

export function SortControl({
  options = [],
  value,
  onSelect,
  open,
  onOpenChange,
  triggerLabel,
  label = "Выбрать вариант",
  className,
  triggerClassName,
  menuClassName,
  optionClassName,
  selectedOptionClassName,
  startIcon,
  endIcon,
  action,
  menuAlignment = "start",
  renderLabel,
  optionValueKey = "value",
  optionLabelKey = "label",
}) {
  const rootRef = useRef(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const normalizedOptions = useMemo(
    () => options.map((option) => ({
      value: option?.[optionValueKey] ?? option?.key ?? option,
      label: option?.[optionLabelKey] ?? option?.label ?? String(option),
    })),
    [optionLabelKey, optionValueKey, options]
  );
  const selectedOption = normalizedOptions.find((option) => option.value === value) ?? normalizedOptions[0];
  const resolvedLabel = typeof renderLabel === "function" ? renderLabel(selectedOption) : triggerLabel ?? selectedOption?.label ?? "";

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        if (isControlled) {
          onOpenChange?.(false);
        } else {
          setInternalOpen(false);
        }
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        if (isControlled) {
          onOpenChange?.(false);
        } else {
          setInternalOpen(false);
        }
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isControlled, isOpen, onOpenChange]);

  return (
    <div ref={rootRef} className={cn("ui-sort-control", isOpen && "is-open", menuAlignment === "end" && "ui-sort-control--align-end", className)}>
      <button
        type="button"
        className={cn("ui-sort-control__trigger", triggerClassName)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
        onClick={() => {
          const nextOpen = !isOpen;
          if (isControlled) {
            onOpenChange?.(nextOpen);
          } else {
            setInternalOpen(nextOpen);
          }
        }}
      >
        {startIcon ? <span className="ui-sort-control__icon" aria-hidden="true">{startIcon}</span> : null}
        <span className="ui-sort-control__label">{resolvedLabel}</span>
        <span className="ui-sort-control__chevron" aria-hidden="true">{endIcon ?? <ChevronDownIcon />}</span>
      </button>

      {action ? <div className="ui-sort-control__action">{action}</div> : null}

      {isOpen ? (
        <div className={cn("ui-sort-control__menu", menuClassName)} role="listbox" aria-label={label}>
          {normalizedOptions.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={cn("ui-sort-control__option", option.value === value && "is-selected", optionClassName, option.value === value && selectedOptionClassName)}
              onClick={() => {
                onSelect?.(option.value);
                if (isControlled) {
                  onOpenChange?.(false);
                } else {
                  setInternalOpen(false);
                }
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
