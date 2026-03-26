import { Badge, Card, IconButton } from "../ui";
import { cn } from "../../lib/cn";

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M11.667 4.167 5.833 10l5.834 5.833" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.667 10H14.167" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function AuthStage({ layout = "flow", className, children }) {
  return (
    <main className="auth-app">
      <section className={cn("auth-stage", `auth-stage--${layout}`, className)}>
        <div className="auth-stage__backdrop" aria-hidden="true" />
        <div className="auth-stage__media auth-stage__media--left" aria-hidden="true" />
        <div className="auth-stage__media auth-stage__media--right" aria-hidden="true" />
        <div className="auth-stage__frame ui-page-shell">{children}</div>
      </section>
    </main>
  );
}

export function AuthSurface({ as = "article", aside = false, className, children, ...props }) {
  return (
    <Card as={as} className={cn("auth-screen-card", aside && "auth-screen-card--aside", className)} {...props}>
      {children}
    </Card>
  );
}

export function AuthBrand() {
  return (
    <div className="auth-brand" aria-label="TRAMPLIN">
      <span className="auth-brand__mark" aria-hidden="true" />
      <span className="auth-brand__label">TRAMPLIN</span>
    </div>
  );
}

export function AuthTopBar({ backHref, backLabel, backButtonSize = "lg" }) {
  return (
    <div className="auth-screen__topbar">
      <IconButton href={backHref} label={backLabel} size={backButtonSize} className="auth-screen__back">
        <BackIcon />
      </IconButton>
      <AuthBrand />
      <span className="auth-screen__topbar-spacer" aria-hidden="true" />
    </div>
  );
}

export function AuthHero({
  badge,
  title,
  description,
  centered = false,
  className,
  titleClassName,
  descriptionClassName,
}) {
  return (
    <div className={cn("auth-screen__copy", centered && "auth-screen__copy--centered", className)}>
      {badge ? (
        <Badge kind="badge" className="auth-screen__badge">
          {badge}
        </Badge>
      ) : null}
      <div className="auth-screen__copy-body">
        <h1 className={cn(titleClassName || (centered ? "ui-type-display" : "ui-type-h2"))}>{title}</h1>
        <p className={cn(descriptionClassName || (centered ? "ui-type-body-lg" : "ui-type-body"))}>{description}</p>
      </div>
    </div>
  );
}

export function AuthNote({ title, accent = false, children, className }) {
  return (
    <div className={cn("auth-note", accent && "auth-note--accent", className)}>
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

export function AuthMetric({ value, description, className }) {
  return (
    <div className={cn("auth-metric", className)}>
      <strong>{value}</strong>
      <span>{description}</span>
    </div>
  );
}

export function AuthList({ items, className }) {
  return (
    <ul className={cn("auth-support-list", className)}>
      {items.map((item) => (
        <li key={item.title}>
          <strong>{item.title}</strong>
          <span>{item.description}</span>
        </li>
      ))}
    </ul>
  );
}
