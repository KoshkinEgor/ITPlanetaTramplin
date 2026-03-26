import { cn } from "../../../lib/cn";

export function DashboardPageHeader({
  title,
  description,
  className,
  ...props
}) {
  return (
    <section className={cn("ui-dashboard-page-header", className)} {...props}>
      <div className="ui-dashboard-page-header__copy">
        {title ? <h1 className="ui-type-h2">{title}</h1> : null}
        {description ? <p className="ui-type-body">{description}</p> : null}
      </div>
    </section>
  );
}
