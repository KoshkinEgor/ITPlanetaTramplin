import { Button, Card, IconButton, StatusBadge, Tag } from "../ui";
import { cn } from "../../lib/cn";
import { useFavoriteOpportunity } from "../../features/favorites/useFavoriteOpportunity";
import { extractOpportunityId } from "../../features/favorites/storage";
import { normalizeOpportunityCardItem } from "../../shared/lib/opportunityPresentation";
import "./OpportunityCard.css";

import { HeartIcon } from "../../shared/ui";

const CHIP_PLACEMENT_BY_VARIANT = {
  row: "top",
  block: "bottom",
};
function normalizeOpportunity(item) {
  return normalizeOpportunityCardItem(item);
}

function resolveAction(action) {
  if (!action?.label) {
    return null;
  }

  return {
    variant: "primary",
    ...action,
  };
}

function splitTags(chips, placement) {
  if (!chips.length || placement === "none") {
    return { topTags: [], bottomTags: [] };
  }

  if (placement === "top") {
    return { topTags: chips, bottomTags: [] };
  }

  if (placement === "split") {
    return {
      topTags: chips.slice(0, 1),
      bottomTags: chips.slice(1),
    };
  }

  return { topTags: [], bottomTags: chips };
}

function renderSummary(data, variant) {
  const hasPrimaryFact = data.primaryFactLabel || data.primaryFactValue;
  const facts = data.summaryFacts;

  if (!hasPrimaryFact) {
    return null;
  }

  if (variant === "row") {
    return (
      <div className="ui-opportunity-card__summary">
        {data.primaryFactLabel ? <span className="ui-opportunity-card__fact-label">{data.primaryFactLabel}</span> : null}
        {data.primaryFactValue ? <strong className="ui-opportunity-card__accent">{data.primaryFactValue}</strong> : null}
        {facts.length ? (
          <div className="ui-opportunity-card__fact-list">
            {facts.map((fact, index) => (
              <span key={`${fact}-${index}`} className="ui-opportunity-card__fact-item">
                {fact}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="ui-opportunity-card__details">
      {data.primaryFactLabel ? <span className="ui-opportunity-card__fact-label">{data.primaryFactLabel}</span> : null}
      {data.primaryFactValue ? <strong className="ui-opportunity-card__accent">{data.primaryFactValue}</strong> : null}
      {facts.length ? (
        <div className="ui-opportunity-card__fact-list">
          {facts.map((fact, index) => (
            <span key={`${fact}-${index}`} className="ui-opportunity-card__fact-item">
              {fact}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function OpportunityCardBase({
  item,
  variant = "block",
  surface = "panel",
  size = "md",
  chipPlacement,
  actionsAlign = "start",
  showSave = true,
  className,
  primaryAction,
  secondaryAction,
  detailAction,
  favoriteLabel = "Сохранить возможность",
  favoritePressed = false,
  onFavoriteClick,
  ...props
}) {
  const data = normalizeOpportunity(item);
  const { opportunityId, isFavorite, toggleFavorite } = useFavoriteOpportunity(extractOpportunityId(item), favoritePressed);
  const actions = [resolveAction(primaryAction), resolveAction(secondaryAction), resolveAction(detailAction)].filter(Boolean);
  const { topTags, bottomTags } = splitTags(data.chips, chipPlacement ?? CHIP_PLACEMENT_BY_VARIANT[variant] ?? "bottom");
  const shouldShowSave = showSave && variant !== "mini";
  const saveButtonSize = variant === "row" ? "xl" : size === "sm" ? "sm" : "md";
  const actionButtonSize = variant === "row" ? "lg" : size === "sm" ? "md" : "lg";
  const hasTopRow = data.type || data.status || topTags.length > 0 || shouldShowSave;
  const handleFavoriteClick = () => {
    const nextState = toggleFavorite();
    onFavoriteClick?.(opportunityId, nextState);
  };

  const saveButton = shouldShowSave ? (
    <IconButton
      type="button"
      label={favoriteLabel}
      aria-pressed={isFavorite}
      active={isFavorite}
      data-opportunity-id={opportunityId ?? undefined}
      onClick={handleFavoriteClick}
      size={saveButtonSize}
      className="ui-opportunity-card__save"
    >
      <HeartIcon />
    </IconButton>
  ) : null;

  const topRow = hasTopRow ? (
    variant === "row" ? (
      <div className="ui-opportunity-card__top">
        <div className="ui-opportunity-card__top-primary">
          {data.type ? <Tag className="ui-opportunity-card__tag">{data.type}</Tag> : null}
        </div>

        <div className="ui-opportunity-card__top-secondary">
          {topTags.map((chip, index) => (
            <Tag key={`${chip}-${index}`} className="ui-opportunity-card__tag">
              {chip}
            </Tag>
          ))}
          {data.status ? (
            <StatusBadge tone={data.statusTone} className="ui-opportunity-card__status">
              {data.status}
            </StatusBadge>
          ) : null}
          {saveButton}
        </div>
      </div>
    ) : (
      <div className="ui-opportunity-card__top">
        <div className="ui-opportunity-card__badges">
          {data.type ? <Tag className="ui-opportunity-card__tag">{data.type}</Tag> : null}
          {data.status ? (
            <StatusBadge tone={data.statusTone} className="ui-opportunity-card__status">
              {data.status}
            </StatusBadge>
          ) : null}
          {topTags.map((chip, index) => (
            <Tag key={`${chip}-${index}`} className="ui-opportunity-card__tag">
              {chip}
            </Tag>
          ))}
        </div>

        {saveButton}
      </div>
    )
  ) : null;

  const details = renderSummary(data, variant);

  const body = (
    <div className="ui-opportunity-card__body">
      <div className="ui-opportunity-card__headline">
        <h3 className="ui-opportunity-card__title">{data.title}</h3>
        {data.meta ? <p className="ui-opportunity-card__meta">{data.meta}</p> : null}
      </div>
      {details}
    </div>
  );

  const chips = bottomTags.length ? (
    <div className="ui-opportunity-card__chips">
      {bottomTags.map((chip, index) => (
        <Tag key={`${chip}-${index}`} className="ui-opportunity-card__tag">
          {chip}
        </Tag>
      ))}
    </div>
  ) : null;

  const actionButtons = actions.length ? (
    <div className={cn("ui-opportunity-card__actions", `ui-opportunity-card__actions--${actionsAlign}`, actions.length > 1 && "is-multiple")}>
      {actions.map((action) => (
        <Button
          key={`${action.label}-${action.href ?? action.variant}`}
          href={action.href}
          onClick={action.onClick}
          variant={action.variant}
          size={actionButtonSize}
          width={action.width ?? (variant === "row" ? "full" : undefined)}
          className={cn("ui-opportunity-card__action", action.className)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  ) : null;

  return (
    <Card
      className={cn(
        "ui-opportunity-card",
        `ui-opportunity-card--${variant}`,
        `ui-opportunity-card--${surface}`,
        `ui-opportunity-card--${size}`,
        className
      )}
      data-opportunity-id={opportunityId ?? undefined}
      data-opportunity-type-tone={data.typeTone ?? undefined}
      data-opportunity-type-key={data.typeKey ?? undefined}
      {...props}
    >
      {variant === "row" ? (
        <div className="ui-opportunity-card__layout">
          {topRow}
          <div className="ui-opportunity-card__main">
            {body}
            {actionButtons ? <div className="ui-opportunity-card__aside">{actionButtons}</div> : null}
          </div>
          {chips}
        </div>
      ) : (
        <>
          {topRow}
          {body}
          {chips}
          {actionButtons}
        </>
      )}
    </Card>
  );
}

export function OpportunityRowCard(props) {
  return <OpportunityCardBase variant="row" actionsAlign="end" {...props} />;
}

export function OpportunityBlockCard(props) {
  return <OpportunityCardBase variant="block" {...props} />;
}
