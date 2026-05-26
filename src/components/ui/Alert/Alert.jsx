import { cn } from "../../../lib/cn";
import { CloseIcon, SuccessIcon, WarningIcon, ErrorIcon, InfoIcon } from "../../../shared/ui";

const toneClassMap = {
  info: "ui-alert--info",
  success: "ui-alert--success",
  warning: "ui-alert--warning",
  error: "ui-alert--error",
};

function AlertIcon({ tone }) {
  if (tone === "success") return <SuccessIcon />;
  if (tone === "warning") return <WarningIcon />;
  if (tone === "error") return <ErrorIcon />;
  return <InfoIcon />;
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
              <CloseIcon />
            </button>
          ) : null}
        </div>
      ) : null}
      {children ? <div className="ui-alert__body">{typeof children === "string" ? <p>{children}</p> : children}</div> : null}
      {actions ? <div className="ui-alert__actions">{actions}</div> : null}
    </Element>
  );
}
