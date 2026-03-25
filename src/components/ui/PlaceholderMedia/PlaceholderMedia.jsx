import { Card } from "../Card/Card";
import { PlaceholderAction } from "../PlaceholderAction/PlaceholderAction";
import { cn } from "../../../lib/cn";

export function PlaceholderMedia({
  eyebrow = "Media slot",
  title = "Shared media scaffold",
  description = "Use this surface while the final uploader or gallery module is not implemented yet.",
  actionLabel = "Media control placeholder",
  actionDescription = "The final action will be replaced by a shared component.",
  className,
  children,
  ...props
}) {
  return (
    <Card className={cn("ui-placeholder-media", className)} {...props}>
      <div className="ui-placeholder-media__copy">
        <span className="ui-placeholder-media__eyebrow">{eyebrow}</span>
        <h3 className="ui-type-h3">{title}</h3>
        <p className="ui-type-body">{description}</p>
      </div>

      <div className="ui-placeholder-media__surface" aria-hidden="true">
        <span className="ui-placeholder-media__glow ui-placeholder-media__glow--lime" />
        <span className="ui-placeholder-media__glow ui-placeholder-media__glow--blue" />
        {children ? <div className="ui-placeholder-media__overlay">{children}</div> : null}
      </div>

      <PlaceholderAction label={actionLabel} description={actionDescription} />
    </Card>
  );
}
