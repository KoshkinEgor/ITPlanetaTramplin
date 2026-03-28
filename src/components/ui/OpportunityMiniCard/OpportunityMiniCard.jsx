import { buildOpportunityDetailRoute } from "../../../app/routes";
import { extractOpportunityId } from "../../../features/favorites/storage";
import { useFavoriteOpportunity } from "../../../features/favorites/useFavoriteOpportunity";
import { cn } from "../../../lib/cn";
import { Button } from "../Button/Button";
import { Card } from "../Card/Card";
import { IconButton } from "../IconButton/IconButton";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import { Tag } from "../Tag/Tag";
import "./OpportunityMiniCard.css";

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

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 5 15 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function getCompactValueSuffix(item) {
  if (item.valueSuffix) {
    return String(item.valueSuffix).trim();
  }

  const note = String(item.note ?? "").trim();

  if (!note || note.length > 24) {
    return "";
  }

  return note;
}

function normalizeOpportunity(item) {
  const chips = Array.isArray(item?.chips) ? item.chips.filter(Boolean).slice(0, 3) : [];

  return {
    type: item?.type ?? item?.eyebrow ?? "",
    status: item?.status ?? "",
    statusTone: item?.statusTone ?? item?.tone ?? "neutral",
    title: item?.title ?? "",
    meta: item?.company ?? item?.meta ?? "",
    valuePrefix: item?.valuePrefix ?? item?.accentPrefix ?? "",
    accent: item?.accent ?? "",
    valueSuffix: getCompactValueSuffix(item ?? {}),
    chips,
  };
}

function resolveDetailAction(detailAction, item) {
  return {
    href: detailAction?.href ?? item?.detailHref ?? item?.href ?? buildOpportunityDetailRoute(),
    label: detailAction?.label ?? item?.detailLabel ?? "Подробнее",
    variant: detailAction?.variant ?? "secondary",
    onClick: detailAction?.onClick,
    width: detailAction?.width ?? item?.detailWidth ?? "full",
  };
}

export function OpportunityMiniCard({
  item,
  variant = "featured",
  className,
  detailAction,
  dismissAction,
  favoriteLabel = "Сохранить возможность",
  favoritePressed = false,
  onFavoriteClick,
  ...props
}) {
  const data = normalizeOpportunity(item);
  const { opportunityId, isFavorite, toggleFavorite } = useFavoriteOpportunity(extractOpportunityId(item), favoritePressed);
  const action = resolveDetailAction(detailAction, item);
  const hasValue = data.valuePrefix || data.accent || data.valueSuffix;
  const isCompact = variant === "compact" || variant === "map-compact";
  const isMapCompact = variant === "map-compact";
  const chips = isMapCompact ? data.chips.slice(0, 2) : data.chips;
  const handleFavoriteClick = () => {
    const nextState = toggleFavorite();
    onFavoriteClick?.(opportunityId, nextState);
  };

  return (
    <Card
      className={cn(
        "ui-opportunity-mini-card",
        isCompact && "ui-opportunity-mini-card--compact",
        isMapCompact && "ui-opportunity-mini-card--map-compact",
        className
      )}
      data-opportunity-id={opportunityId ?? undefined}
      {...props}
    >
      <div className="ui-opportunity-mini-card__top">
        <div className="ui-opportunity-mini-card__badges">
          {data.type ? (
            <Tag className="ui-opportunity-mini-card__eyebrow">
              {data.type}
            </Tag>
          ) : null}

          {data.status ? (
            <StatusBadge tone={data.statusTone} className="ui-opportunity-mini-card__status">
              {data.status}
            </StatusBadge>
          ) : null}
        </div>

        {dismissAction ? (
          <IconButton
            type="button"
            variant="surface"
            size={isMapCompact ? "lg" : isCompact ? "xl" : "2xl"}
            className="ui-opportunity-mini-card__favorite ui-opportunity-mini-card__favorite--dismiss"
            label={dismissAction.label}
            onClick={dismissAction.onClick}
          >
            <CloseIcon />
          </IconButton>
        ) : (
          <IconButton
            type="button"
            variant="surface"
            size={isMapCompact ? "lg" : isCompact ? "xl" : "2xl"}
            className="ui-opportunity-mini-card__favorite"
            label={favoriteLabel}
            aria-pressed={isFavorite}
            active={isFavorite}
            data-opportunity-id={opportunityId ?? undefined}
            onClick={handleFavoriteClick}
          >
            <HeartIcon />
          </IconButton>
        )}
      </div>

      <div className="ui-opportunity-mini-card__body">
        <h3 className="ui-opportunity-mini-card__title">{data.title}</h3>

        {data.meta ? (
          <p className="ui-opportunity-mini-card__meta">{data.meta}</p>
        ) : null}

        {hasValue ? (
          <p className="ui-opportunity-mini-card__value">
            {data.valuePrefix ? (
              <span className="ui-opportunity-mini-card__value-prefix">{data.valuePrefix}</span>
            ) : null}
            {data.accent ? <strong className="ui-opportunity-mini-card__accent">{data.accent}</strong> : null}
            {data.valueSuffix ? (
              <span className="ui-opportunity-mini-card__value-suffix">{data.valueSuffix}</span>
            ) : null}
          </p>
        ) : null}
      </div>

      {chips.length ? (
        <div className="ui-opportunity-mini-card__chips">
          {chips.map((chip, index) => (
            <Tag key={`${chip}-${index}`} className="ui-opportunity-mini-card__chip">
              {chip}
            </Tag>
          ))}
        </div>
      ) : null}

      <Button
        href={action.href}
        onClick={action.onClick}
        variant={action.variant}
        size={isMapCompact ? "sm" : isCompact ? "md" : "lg"}
        width={action.width}
        className="ui-opportunity-mini-card__action"
      >
        {action.label}
      </Button>
    </Card>
  );
}
