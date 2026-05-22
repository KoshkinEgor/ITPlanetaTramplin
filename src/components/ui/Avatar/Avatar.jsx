import { useEffect, useState } from "react";
import { cn } from "../../../lib/cn";

const sizeClassMap = {
  sm: "ui-avatar--sm",
  md: "",
  lg: "ui-avatar--lg",
  xl: "ui-avatar--xl",
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
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedInitials = initials || getInitials(name);
  const resolvedSrc = src && !imageFailed ? src : "";

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

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
      {resolvedSrc ? (
        <img
          className="ui-avatar__image"
          src={resolvedSrc}
          alt={alt || name || "Avatar"}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="ui-avatar__initials">{resolvedInitials}</span>
      )}
      {status ? <span className="ui-avatar__status" aria-hidden="true" title={statusLabel || status} /> : null}
    </span>
  );
}
