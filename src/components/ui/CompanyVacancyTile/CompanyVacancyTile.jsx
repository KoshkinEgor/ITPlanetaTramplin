import { forwardRef } from "react";
import { AppLink } from "../../../app/AppLink";
import { cn } from "../../../lib/cn";
import { IconButton } from "../IconButton/IconButton";
import "./CompanyVacancyTile.css";

import { HeartIcon } from "../../../shared/ui";

const toneClassMap = {
  lime: "ui-company-vacancy-tile--lime",
  neutral: "ui-company-vacancy-tile--neutral",
};
function getResolvedInitials(name, initials) {
  return (
    initials ||
    String(name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") ||
    "?"
  );
}

function TileContent({ count, initials, name }) {
  return (
    <>
      <span className="ui-company-vacancy-tile__avatar" aria-hidden="true">
        {initials}
      </span>
      <span className="ui-company-vacancy-tile__copy">
        <strong>{name}</strong>
        <span>{count}</span>
      </span>
    </>
  );
}

export const CompanyVacancyTile = forwardRef(function CompanyVacancyTile(
  {
    as = "article",
    href,
    name,
    count,
    initials,
    tone = "lime",
    className,
    favoritePressed = false,
    favoriteLabel = "Сохранить компанию",
    onFavoriteClick,
    showFavorite = false,
    ...props
  },
  ref
) {
  const Element = href ? AppLink : as;
  const resolvedInitials = getResolvedInitials(name, initials);
  const tileClassName = cn("ui-company-vacancy-tile", toneClassMap[tone] ?? toneClassMap.lime, className);

  if (!showFavorite) {
    return (
      <Element ref={ref} href={href} className={tileClassName} {...props}>
        <TileContent count={count} initials={resolvedInitials} name={name} />
      </Element>
    );
  }

  return (
    <div ref={ref} className={cn(tileClassName, "ui-company-vacancy-tile--with-favorite")} {...props}>
      <Element href={href} className="ui-company-vacancy-tile__main">
        <TileContent count={count} initials={resolvedInitials} name={name} />
      </Element>
      <IconButton
        type="button"
        size="md"
        label={favoriteLabel}
        aria-pressed={favoritePressed}
        active={favoritePressed}
        className="ui-company-vacancy-tile__favorite"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onFavoriteClick?.(event);
        }}
      >
        <HeartIcon />
      </IconButton>
    </div>
  );
});
