import { cn } from "../../../lib/cn";

export function PlaceholderAction({
  label = "Placeholder action",
  description = "Shared action stub",
  className,
  ...props
}) {
  return (
    <div className={cn("ui-placeholder-action", className)} role="note" {...props}>
      <span className="ui-placeholder-action__label">{label}</span>
      <span className="ui-placeholder-action__description">{description}</span>
    </div>
  );
}
