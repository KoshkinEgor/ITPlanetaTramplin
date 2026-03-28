import { forwardRef } from "react";
import { AppLink } from "../../../app/AppLink";
import { cn } from "../../../lib/cn";
import { IconButton } from "../IconButton/IconButton";
import "./CompanyVacancyTile.css";

const toneClassMap = {
  lime: "ui-company-vacancy-tile--lime",
  neutral: "ui-company-vacancy-tile--neutral",
};

function HeartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 16.2s-5.2-3.5-6.7-6.6C2.1 7.2 3.2 4.5 6 4.5c1.5 0 2.7.8 4 2.3 1.3-1.5 2.5-2.3 4-2.3 2.8 0 3.9 2.7 2.7 5.1-1.5 3.1-6.7 6.6-6.7 6.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
