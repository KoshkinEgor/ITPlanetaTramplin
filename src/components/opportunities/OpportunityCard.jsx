import { Button, Card, IconButton, StatusBadge, Tag } from "../ui";
import { cn } from "../../lib/cn";
import { useFavoriteOpportunity } from "../../features/favorites/useFavoriteOpportunity";
import { extractOpportunityId } from "../../features/favorites/storage";
import "./OpportunityCard.css";

const CHIP_PLACEMENT_BY_VARIANT = {
  row: "top",
  block: "bottom",
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

function normalizeOpportunity(item) {
  return {
    type: item?.type ?? item?.eyebrow ?? "",
    title: item?.title ?? "",
    meta: item?.company ?? item?.meta ?? "",
    accent: item?.accent ?? "",
    note: item?.note ?? "",
    status: item?.status ?? "",
    statusTone: item?.statusTone ?? item?.tone ?? "neutral",
    chips: Array.isArray(item?.chips) ? item.chips.filter(Boolean) : [],
  };
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

  const details = variant === "row"
    ? (data.accent || data.note ? (
        <div className="ui-opportunity-card__value">
          {data.accent ? <strong className="ui-opportunity-card__accent">{data.accent}</strong> : null}
          {data.note ? <span className="ui-opportunity-card__inline-note">{data.note}</span> : null}
        </div>
      ) : null)
    : (data.accent || data.note ? (
        <div className="ui-opportunity-card__details">
          {data.accent ? <strong className="ui-opportunity-card__accent">{data.accent}</strong> : null}
          {data.note ? <p className="ui-opportunity-card__note">{data.note}</p> : null}
        </div>
      ) : null);

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
