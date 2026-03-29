import { buildOpportunityDetailRoute } from "../../../app/routes";
import { extractOpportunityId } from "../../../features/favorites/storage";
import { useFavoriteOpportunity } from "../../../features/favorites/useFavoriteOpportunity";
import { cn } from "../../../lib/cn";
import { normalizeOpportunityCardItem } from "../../../shared/lib/opportunityPresentation";
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

function getVisibleFacts(data, { compact = false } = {}) {
  if (compact) {
    return [data.compactFact || data.secondaryFact || data.tertiaryFact].filter(Boolean);
  }

  return data.summaryFacts;
}

function normalizeOpportunity(item) {
  const data = normalizeOpportunityCardItem(item);

  return {
    ...data,
    chips: data.chips.slice(0, 3),
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
  const isCompact = variant === "compact" || variant === "map-compact";
  const isMapCompact = variant === "map-compact";
  const chips = isMapCompact ? data.chips.slice(0, 2) : data.chips;
  const facts = getVisibleFacts(data, { compact: isCompact });
  const hasPrimaryFact = data.primaryFactLabel || data.primaryFactValue;
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
      data-opportunity-type-tone={data.typeTone ?? undefined}
      data-opportunity-type-key={data.typeKey ?? undefined}
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

        {hasPrimaryFact ? (
          <div className="ui-opportunity-mini-card__fact-block">
            {data.primaryFactLabel ? (
              <p className="ui-opportunity-mini-card__fact-label">{data.primaryFactLabel}</p>
            ) : null}
            {data.primaryFactValue ? (
              <p className="ui-opportunity-mini-card__value">
                <strong className="ui-opportunity-mini-card__accent">{data.primaryFactValue}</strong>
              </p>
            ) : null}
            {facts.length ? (
              <div className="ui-opportunity-mini-card__facts">
                {facts.map((fact, index) => (
                  <span key={`${fact}-${index}`} className="ui-opportunity-mini-card__fact-item">
                    {fact}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
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
