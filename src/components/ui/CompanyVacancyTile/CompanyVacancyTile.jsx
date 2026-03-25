import { forwardRef } from "react";
import { AppLink } from "../../../app/AppLink";
import { cn } from "../../../lib/cn";
import "./CompanyVacancyTile.css";

const toneClassMap = {
  lime: "ui-company-vacancy-tile--lime",
  neutral: "ui-company-vacancy-tile--neutral",
};

export const CompanyVacancyTile = forwardRef(function CompanyVacancyTile(
  { as = "article", href, name, count, initials, tone = "lime", className, ...props },
  ref
) {
  const Element = href ? AppLink : as;
  const resolvedInitials =
    initials ||
    String(name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") ||
    "?";

  return (
    <Element
      ref={ref}
      href={href}
      className={cn("ui-company-vacancy-tile", toneClassMap[tone] ?? toneClassMap.lime, className)}
      {...props}
    >
      <span className="ui-company-vacancy-tile__avatar" aria-hidden="true">
        {resolvedInitials}
      </span>
      <span className="ui-company-vacancy-tile__copy">
        <strong>{name}</strong>
        <span>{count}</span>
      </span>
    </Element>
  );
});
