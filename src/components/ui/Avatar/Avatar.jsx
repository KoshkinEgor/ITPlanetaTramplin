import { cn } from "../../../lib/cn";

const sizeClassMap = {
  sm: "ui-avatar--sm",
  md: "",
  lg: "ui-avatar--lg",
};

const shapeClassMap = {
  circle: "",
  rounded: "ui-avatar--rounded",
};

const toneClassMap = {
  accent: "",
  neutral: "ui-avatar--neutral",
  success: "ui-avatar--tone-success",
  warning: "ui-avatar--tone-warning",
};

const statusClassMap = {
  online: "ui-avatar--online",
  away: "ui-avatar--away",
  busy: "ui-avatar--busy",
};

function getInitials(name) {
  if (!name) {
    return "?";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  src,
  alt,
  name,
  initials,
  size = "md",
  shape = "circle",
  tone = "accent",
  status,
  statusLabel,
  className,
  ...props
}) {
  const resolvedInitials = initials || getInitials(name);

  return (
    <span
      className={cn(
        "ui-avatar",
        sizeClassMap[size],
        shapeClassMap[shape],
        toneClassMap[tone],
        statusClassMap[status],
        className
      )}
      {...props}
    >
      {src ? <img className="ui-avatar__image" src={src} alt={alt || name || "Avatar"} /> : <span className="ui-avatar__initials">{resolvedInitials}</span>}
      {status ? <span className="ui-avatar__status" aria-hidden="true" title={statusLabel || status} /> : null}
    </span>
  );
}
