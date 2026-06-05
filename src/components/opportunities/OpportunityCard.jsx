import { useMemo } from "react";
import { Button, Card, IconButton, StatusBadge, Tag } from "../ui";
import { cn } from "../../lib/cn";
import { useFavoriteOpportunity } from "../../features/favorites/useFavoriteOpportunity";
import { extractOpportunityId } from "../../features/favorites/storage";
import { normalizeOpportunityCardItem } from "../../shared/lib/opportunityPresentation";
import { useAuthSession } from "../../auth/api";
import { useCandidateApplications } from "../../candidate-portal/candidate-applications-store";
import "./OpportunityCard.css";

import { HeartIcon, SparkIcon, InfoIcon } from "../../shared/ui";

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
  aiItem,
  ...props
}) {
  const data = normalizeOpportunity(item);
  const { opportunityId, isFavorite, toggleFavorite } = useFavoriteOpportunity(extractOpportunityId(item), favoritePressed);
  const actions = [resolveAction(primaryAction), resolveAction(secondaryAction), resolveAction(detailAction)].filter(Boolean);
  const { topTags, bottomTags } = splitTags(data.chips, chipPlacement ?? CHIP_PLACEMENT_BY_VARIANT[variant] ?? "bottom");
  const shouldShowSave = showSave && variant !== "mini";
  const saveButtonSize = variant === "row" ? "xl" : size === "sm" ? "sm" : "md";
  const actionButtonSize = variant === "row" ? "lg" : size === "sm" ? "md" : "lg";

  const authSession = useAuthSession();
  const isCandidateViewer = authSession?.status === "authenticated" && authSession?.user?.role === "candidate";
  const { applications } = useCandidateApplications({ autoRefresh: isCandidateViewer });

  const currentApplication = useMemo(() => {
    if (!opportunityId || !isCandidateViewer) return null;
    return applications.find((app) => 
      String(app.opportunityId) === String(opportunityId) && 
      app.status !== "withdrawn"
    );
  }, [applications, opportunityId, isCandidateViewer]);

  const displayStatus = useMemo(() => {
    if (currentApplication) {
      const isEvent = data.typeKey === "event" || data.typeKey === "mentoring";
      const appStatus = currentApplication.status;
      if (appStatus === "accepted") {
        return isEvent ? "Записан(а)" : "Принят(а)";
      } else if (appStatus === "invited") {
        return "Приглашение";
      } else if (appStatus === "rejected") {
        return "Отказ";
      } else if (appStatus === "reviewing") {
        return "На рассмотрении";
      } else if (appStatus === "submitted") {
        return isEvent ? "Заявка отправлена" : "Отклик отправлен";
      }
    }
    return data.status;
  }, [currentApplication, data.status, data.typeKey]);

  const displayStatusTone = useMemo(() => {
    if (currentApplication) {
      const appStatus = currentApplication.status;
      if (appStatus === "accepted") {
        return "success";
      } else if (appStatus === "invited") {
        return "lime";
      } else if (appStatus === "rejected") {
        return "warning";
      } else if (appStatus === "reviewing") {
        return "info";
      } else if (appStatus === "submitted") {
        return "info";
      }
    }
    return data.statusTone;
  }, [currentApplication, data.statusTone]);

  const hasTopRow = data.type || displayStatus || topTags.length > 0 || shouldShowSave || aiItem;
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
          {displayStatus ? (
            <StatusBadge tone={displayStatusTone} className="ui-opportunity-card__status">
              {displayStatus}
            </StatusBadge>
          ) : null}
          {saveButton}
        </div>
      </div>
    ) : (
      <div className="ui-opportunity-card__top">
        <div className="ui-opportunity-card__badges">
          {data.type ? <Tag className="ui-opportunity-card__tag">{data.type}</Tag> : null}
          {displayStatus ? (
            <StatusBadge tone={displayStatusTone} className="ui-opportunity-card__status">
              {displayStatus}
            </StatusBadge>
          ) : null}
          {topTags.map((chip, index) => (
            <Tag key={`${chip}-${index}`} className="ui-opportunity-card__tag">
              {chip}
            </Tag>
          ))}
          {aiItem ? (
            <div className="candidate-career-opportunity-ai__badge-wrapper" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div className="candidate-career-opportunity-ai__badge">
                <SparkIcon className="candidate-career-opportunity-ai__spark" />
                <span>{Math.max(0, Math.min(99, Math.round(aiItem.matchPercent)))}% совпадение</span>
              </div>
              {aiItem.reason ? (
                <div className="candidate-career-opportunity-ai__info-wrapper">
                  <button type="button" className="candidate-career-opportunity-ai__info-trigger" aria-label="Почему подходит?">
                    <InfoIcon />
                  </button>
                  <div className="candidate-career-opportunity-ai__tooltip">
                    <div className="candidate-career-opportunity-ai__tooltip-title">Анализ соответствия</div>
                    <p className="candidate-career-opportunity-ai__tooltip-text">{aiItem.reason}</p>
                    {aiItem.nextStep ? (
                      <div className="candidate-career-opportunity-ai__tooltip-next">
                        <strong>Рекомендация:</strong> {aiItem.nextStep}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
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
      {aiItem && (aiItem.matchedSkills?.length > 0 || aiItem.missingSkills?.length > 0) ? (
        <div className="candidate-career-opportunity-ai__skills-alignment" style={{ marginTop: "12px", marginBottom: "4px" }}>
          {aiItem.matchedSkills.length > 0 ? (
            <div className="candidate-career-opportunity-ai__skills-row">
              <span className="candidate-career-opportunity-ai__skills-label">Вам подходит:</span>
              <div className="candidate-career-opportunity-ai__skills-list">
                {aiItem.matchedSkills.slice(0, 3).map((skill) => (
                  <span key={skill} className="candidate-career-opportunity-ai__skill-tag is-matched">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {aiItem.missingSkills.length > 0 ? (
            <div className="candidate-career-opportunity-ai__skills-row">
              <span className="candidate-career-opportunity-ai__skills-label">Стоит подтянуть:</span>
              <div className="candidate-career-opportunity-ai__skills-list">
                {aiItem.missingSkills.slice(0, 3).map((skill) => (
                  <span key={skill} className="candidate-career-opportunity-ai__skill-tag is-missing">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
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
