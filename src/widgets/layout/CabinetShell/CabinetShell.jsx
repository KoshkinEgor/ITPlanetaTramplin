import { AppLink } from "../../../app/AppLink";
import { Card } from "../../../shared/ui";
import { cn } from "../../../shared/lib/cn";
import "./CabinetShell.css";

export function CabinetShell({ header, sidebar, summary, children, className, ...props }) {
  return (
    <main className={cn("cabinet-shell", className)} {...props}>
      <div className="cabinet-shell__backdrop" aria-hidden="true" />
      <div className="cabinet-shell__frame">
        {header ? <div className="cabinet-shell__header">{header}</div> : null}

        <div className="cabinet-shell__layout">
          {sidebar ? <aside className="cabinet-shell__sidebar">{sidebar}</aside> : null}

          <div className="cabinet-shell__main">
            {summary ? <div className="cabinet-shell__summary">{summary}</div> : null}
            <div className="cabinet-shell__content">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}

export function CabinetSidebar({
  title,
  items = [],
  activeKey,
  footerSummary,
  ariaLabel = "Разделы кабинета",
  className,
  ...props
}) {
  return (
    <Card className={cn("cabinet-sidebar", className)} {...props}>
      {title ? (
        <div className="cabinet-sidebar__head">
          <p className="ui-type-body">{title}</p>
        </div>
      ) : null}

      <nav className="cabinet-sidebar__nav" aria-label={ariaLabel}>
        {items.map((item) => (
          <AppLink
            key={item.key ?? item.label}
            href={item.href}
            className={cn("cabinet-sidebar__link", item.key === activeKey && "is-active", item.disabled && "is-disabled")}
            aria-current={item.key === activeKey ? "page" : undefined}
            aria-disabled={item.disabled || undefined}
          >
            <span>{item.label}</span>
            {item.badge ? <span className="cabinet-sidebar__badge">{item.badge}</span> : null}
          </AppLink>
        ))}
      </nav>

      {footerSummary ? <div className="cabinet-sidebar__footer">{footerSummary}</div> : null}
    </Card>
  );
}

export function CabinetContentSection({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  ...props
}) {
  return (
    <Card className={cn("cabinet-content-section", className)} {...props}>
      {(eyebrow || title || description || actions) ? (
        <div className="cabinet-content-section__head">
          <div className="cabinet-content-section__copy">
            {eyebrow ? <span className="cabinet-content-section__eyebrow">{eyebrow}</span> : null}
            {title ? <h2 className="ui-type-h2">{title}</h2> : null}
            {description ? <p className="ui-type-body">{description}</p> : null}
          </div>
          {actions ? <div className="cabinet-content-section__actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("cabinet-content-section__body", bodyClassName)}>{children}</div>
    </Card>
  );
}
