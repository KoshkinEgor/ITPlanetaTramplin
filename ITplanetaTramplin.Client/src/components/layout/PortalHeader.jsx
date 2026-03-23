import { Button } from "../ui";
import { cn } from "../../lib/cn";
import "./PortalHeader.css";

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

function BellIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 3.5a4 4 0 0 0-4 4v1.3c0 .8-.2 1.6-.7 2.2L4.3 12a1 1 0 0 0 .7 1.7h10a1 1 0 0 0 .7-1.7l-1-.9a3.4 3.4 0 0 1-.7-2.2V7.5a4 4 0 0 0-4-4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.2 15.5a2 2 0 0 0 3.6 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const DEFAULT_ICON_BUTTONS = [
  { key: "favorites", label: "Избранное", icon: <HeartIcon /> },
  { key: "notifications", label: "Уведомления", icon: <BellIcon /> },
];

function HeaderIconButton({ label, href, children }) {
  if (href) {
    return (
      <a href={href} className="portal-header__icon-button" aria-label={label}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className="portal-header__icon-button" aria-label={label}>
      {children}
    </button>
  );
}

export function PortalHeader({
  navItems,
  currentKey,
  brandHref = "../home/index.html",
  brandLabel = "TRAMPLIN",
  actionHref,
  actionLabel,
  actionVariant = "primary",
  iconButtons = DEFAULT_ICON_BUTTONS,
  className,
}) {
  return (
    <header className={cn("portal-header", className)}>
      <a href={brandHref} className="portal-header__brand" aria-label="Tramplin">
        <span className="portal-header__brand-mark" aria-hidden="true" />
        <span>{brandLabel}</span>
      </a>

      <nav className="portal-header__nav" aria-label="Основная навигация">
        {navItems.map((item) => (
          <a
            key={item.key ?? item.label}
            href={item.href}
            className={cn("portal-header__nav-link", item.key === currentKey && "is-active")}
            aria-current={item.key === currentKey ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="portal-header__actions">
        {iconButtons.map((item) => (
          <HeaderIconButton key={item.key ?? item.label} label={item.label} href={item.href}>
            {item.icon}
          </HeaderIconButton>
        ))}
        {actionHref && actionLabel ? (
          <Button as="a" href={actionHref} variant={actionVariant} className="portal-header__action">
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </header>
  );
}
