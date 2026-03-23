import { Card } from "../ui";
import { cn } from "../../lib/cn";

function CandidateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.25" r="3.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.75 18.25C6.721 14.868 9.051 13.25 12 13.25C14.949 13.25 17.279 14.868 18.25 18.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function EmployerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.25 18.75V7.25C7.25 6.56 7.81 6 8.5 6H15.5C16.19 6 16.75 6.56 16.75 7.25V18.75" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 9.25H14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 12.25H14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 18.75V15.75H14V18.75" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M5.5 18.75H18.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function getIcon(icon) {
  if (icon === "candidate") {
    return <CandidateIcon />;
  }

  if (icon === "employer") {
    return <EmployerIcon />;
  }

  return null;
}

export function AuthOptionCard({
  title,
  description,
  icon,
  checked = false,
  compact = false,
  showIndicator = true,
  className,
  onSelect,
  ...props
}) {
  const iconNode = getIcon(icon);

  return (
    <Card
      as="button"
      type="button"
      interactive
      selected={checked}
      className={cn("auth-option-card", compact && "auth-option-card--compact", className)}
      onClick={onSelect}
      role="radio"
      aria-checked={checked}
      {...props}
    >
      {iconNode ? (
        <span className={cn("auth-option-card__icon", `auth-option-card__icon--${icon}`)} aria-hidden="true">
          {iconNode}
        </span>
      ) : null}
      <span className="auth-option-card__body">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      {showIndicator ? <span className="auth-option-card__indicator" aria-hidden="true" /> : null}
    </Card>
  );
}
