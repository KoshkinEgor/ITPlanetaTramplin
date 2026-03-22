import { cn } from "../../../lib/cn";

const toneClassMap = {
  info: "ui-alert--info",
  success: "ui-alert--success",
  warning: "ui-alert--warning",
  error: "ui-alert--error",
};

function AlertIcon({ tone }) {
  if (tone === "success") {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3.5 8.2 6.4 11.1 12.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (tone === "warning") {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2.3 14 13H2L8 2.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 5.8V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.1" r=".8" fill="currentColor" />
      </svg>
    );
  }

  if (tone === "error") {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5.1V8.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.1" r=".8" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.1V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="4.8" r=".8" fill="currentColor" />
    </svg>
  );
}

function DismissIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4.5 4.5 11.5 11.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M11.5 4.5 4.5 11.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function Alert({
  as = "article",
  tone = "info",
  title,
  icon,
  showIcon = false,
  dismissLabel = "Dismiss alert",
  onDismiss,
  className,
  children,
  actions,
  ...props
}) {
  const Element = as;

  return (
    <Element
      className={cn("ui-alert", toneClassMap[tone] ?? toneClassMap.info, className)}
      role={tone === "error" ? "alert" : "status"}
      {...props}
    >
      {(showIcon || title || onDismiss) ? (
        <div className="ui-alert__head">
          <div className="ui-alert__lead">
            {showIcon ? <span className="ui-alert__icon">{icon ?? <AlertIcon tone={tone} />}</span> : null}
            {title ? <strong>{title}</strong> : null}
          </div>
          {onDismiss ? (
            <button type="button" className="ui-alert__dismiss" aria-label={dismissLabel} onClick={onDismiss}>
              <DismissIcon />
            </button>
          ) : null}
        </div>
      ) : null}
      {children ? <div className="ui-alert__body">{typeof children === "string" ? <p>{children}</p> : children}</div> : null}
      {actions ? <div className="ui-alert__actions">{actions}</div> : null}
    </Element>
  );
}
