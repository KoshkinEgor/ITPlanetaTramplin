import { Card, CandidateIcon, EmployerIcon, CuratorIcon } from "../ui";
import { cn } from "../../lib/cn";

function getIcon(icon) {
  if (icon === "candidate") {
    return <CandidateIcon />;
  }

  if (icon === "employer") {
    return <EmployerIcon />;
  }

  if (icon === "curator") {
    return <CuratorIcon />;
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
