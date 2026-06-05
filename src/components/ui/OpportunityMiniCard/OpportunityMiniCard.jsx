import { useMemo } from "react";
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
import { useAuthSession } from "../../../auth/api";
import { useCandidateApplications } from "../../../candidate-portal/candidate-applications-store";
import "./OpportunityMiniCard.css";
import { CloseIcon, HeartIcon } from "../../../shared/ui";

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

          {displayStatus ? (
            <StatusBadge tone={displayStatusTone} className="ui-opportunity-mini-card__status">
              {displayStatus}
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
