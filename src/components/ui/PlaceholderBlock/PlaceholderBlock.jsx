import { Card } from "../Card/Card";
import { cn } from "../../../lib/cn";

export function PlaceholderBlock({
  eyebrow = "Placeholder",
  title = "Module scaffold",
  description = "This area is intentionally reserved for a shared component or feature block.",
  action,
  children,
  className,
  ...props
}) {
  return (
    <Card className={cn("ui-placeholder-block", className)} {...props}>
      <div className="ui-placeholder-block__copy">
        <span className="ui-placeholder-block__eyebrow">{eyebrow}</span>
        <h3 className="ui-type-h3">{title}</h3>
        <p className="ui-type-body">{description}</p>
      </div>
      {children ? <div className="ui-placeholder-block__body">{children}</div> : null}
      {action ? <div className="ui-placeholder-block__action">{action}</div> : null}
    </Card>
  );
}
