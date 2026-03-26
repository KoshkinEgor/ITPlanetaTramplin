import { useEffect, useMemo, useState } from "react";
import { decideOpportunityModeration, getModerationOpportunities } from "../api/moderation";
import { ApiError } from "../lib/http";
import { Alert, Card, DashboardPageHeader, EmptyState, Loader, ModerationDecisionSelect, Tag } from "../shared/ui";
import { ModeratorFilterPill, ModeratorSearchBar, ModeratorStatusBadge } from "./shared";
import { MODERATION_DECISION_OPTIONS } from "./moderationDecisionOptions";

const MODERATION_FILTERS = [
  { value: "all", label: "Все" },
  { value: "pending", label: "На проверке" },
  { value: "approved", label: "Одобрено" },
  { value: "revision", label: "Доработка" },
  { value: "rejected", label: "Отклонено" },
];

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function translateOpportunityType(value) {
  switch (value) {
    case "vacancy":
      return "Вакансия";
    case "internship":
      return "Стажировка";
    case "event":
      return "Мероприятие";
    default:
      return value || "Возможность";
  }
}

function translateStatus(status) {
  switch (status) {
    case "approved":
      return "Одобрено";
    case "revision":
      return "Доработка";
    case "rejected":
      return "Отклонено";
    default:
      return "На проверке";
  }
}

function formatDate(value) {
  if (!value) {
    return "Дата не указана";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function getOpportunityLocation(item) {
  return item.locationCity || item.locationAddress || "Не указана";
}

function getInitialDecision(item) {
  return MODERATION_DECISION_OPTIONS.some((option) => option.value === item?.moderationStatus) ? item.moderationStatus : "approved";
}

function getOpportunityDecisionDialog(option, item) {
  const actionLabelByDecision = {
    approved: "Одобрить публикацию",
    revision: "Отправить публикацию на доработку",
    rejected: "Отклонить публикацию",
  };

  const descriptionByDecision = item?.title
    ? {
        approved: `Публикация «${item.title}» будет одобрена сразу после подтверждения.`,
        revision: `Публикация «${item.title}» вернется компании со статусом «Доработка».`,
        rejected: `Публикация «${item.title}» получит статус «Отклонено» после подтверждения.`,
      }
    : {
        approved: "Выбранная публикация будет одобрена сразу после подтверждения.",
        revision: "Выбранная публикация вернется компании со статусом «Доработка».",
        rejected: "Выбранная публикация получит статус «Отклонено» после подтверждения.",
      };

  return {
    actionLabel: actionLabelByDecision[option.value] ?? option.label,
    question: "Вы уверены?",
    description: descriptionByDecision[option.value] ?? "Изменение будет применено после подтверждения.",
    confirmLabel: option.confirmationButtonLabel ?? option.label,
    reasonLabel: option.value === "approved" ? undefined : "Причина отказа",
    reasonPlaceholder:
      option.value === "revision"
        ? "Например, не указан формат мероприятия"
        : option.value === "rejected"
          ? "Например, публикация нарушает правила платформы"
          : undefined,
    reasonResetLabel: option.value === "approved" ? undefined : "Сбросить",
  };
}

function OpportunityRow({ item, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`moderator-table__row ${selected ? "is-active" : ""}`.trim()}
      aria-pressed={selected}
      onClick={() => onSelect(item.id)}
    >
      <span className="moderator-table__cell moderator-table__cell--title">{item.title}</span>
      <span className="moderator-table__cell">{item.companyName}</span>
      <span className="moderator-table__cell">
        <Tag>{translateOpportunityType(item.opportunityType)}</Tag>
      </span>
      <span className="moderator-table__cell">{formatDate(item.publishAt)}</span>
      <span className="moderator-table__cell moderator-table__cell--status">
        <ModeratorStatusBadge label={translateStatus(item.moderationStatus)} tone={item.moderationStatus} />
      </span>
    </button>
  );
}

function OpportunityCompactCard({ item, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`moderator-opportunity-compact ${selected ? "is-active" : ""}`.trim()}
      aria-pressed={selected}
      onClick={() => onSelect(item.id)}
    >
      <div className="moderator-opportunity-compact__top">
        <Tag>{translateOpportunityType(item.opportunityType)}</Tag>
        <ModeratorStatusBadge label={translateStatus(item.moderationStatus)} tone={item.moderationStatus} />
      </div>

      <div className="moderator-opportunity-compact__copy">
        <strong className="moderator-opportunity-compact__title">{item.title}</strong>
        <span className="moderator-opportunity-compact__company">{item.companyName}</span>
      </div>

      <div className="moderator-opportunity-compact__meta">
        <span>{getOpportunityLocation(item)}</span>
        <span>{formatDate(item.publishAt)}</span>
      </div>
    </button>
  );
}

export function ModeratorOpportunitiesApp() {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ status: "loading", items: [], error: null });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [decision, setDecision] = useState("approved");
  const [decisionState, setDecisionState] = useState({ status: "idle", error: "" });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const items = await getModerationOpportunities(controller.signal);
        const normalizedItems = Array.isArray(items) ? items : [];
        setState({ status: "ready", items: normalizedItems, error: null });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({ status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error", items: [], error });
      }
    }

    load();
    return () => controller.abort();
  }, [reloadKey]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalize(query);

    return state.items.filter((item) => {
      const haystack = normalize([item.title, item.companyName, item.opportunityType, item.locationCity, item.locationAddress].join(" "));
      const matchesFilter = statusFilter === "all" ? true : item.moderationStatus === statusFilter;
      return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [query, state.items, statusFilter]);

  const activeItem = filteredItems.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId === null) {
      return;
    }

    if (!filteredItems.some((item) => item.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredItems, selectedId]);

  useEffect(() => {
    setDecision(getInitialDecision(activeItem));
  }, [activeItem]);

  function handleOpportunitySelect(nextId) {
    setSelectedId((current) => (current === nextId ? null : nextId));

    if (decisionState.status !== "idle") {
      setDecisionState({ status: "idle", error: "" });
    }
  }

  async function handleDecisionSubmit(nextDecision) {
    if (!activeItem) {
      return;
    }

    setDecisionState({ status: "saving", error: "" });

    try {
      await decideOpportunityModeration(activeItem.id, nextDecision);
      setDecision(nextDecision);
      setDecisionState({ status: "success", error: "" });
      setReloadKey((current) => current + 1);
    } catch (error) {
      setDecisionState({
        status: "error",
        error: error?.message ?? "Не удалось применить решение модерации.",
      });
      throw error;
    }
  }

  return (
    <>
      <DashboardPageHeader
        title="Модерация возможностей"
        description="Проверка вакансий, стажировок и мероприятий с быстрыми решениями и детальной карточкой."
      />

      <div className="moderator-toolbar-stack">
        <ModeratorSearchBar value={query} onChange={setQuery} placeholder="Поиск по названию, компании или локации" />
        <div className="moderator-panel__filters moderator-fade-up moderator-fade-up--delay-1">
          {MODERATION_FILTERS.map((filter) => (
            <ModeratorFilterPill
              key={filter.value}
              label={filter.label}
              active={filter.value === statusFilter}
              onClick={() => setStatusFilter(filter.value)}
            />
          ))}
        </div>
      </div>

      {state.status === "loading" ? <Loader label="Загружаем возможности" surface /> : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить возможности" showIcon>
          {state.error?.message ?? "Попробуйте повторить позже."}
        </Alert>
      ) : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Доступ ограничен"
            title="Нужна роль модератора"
            description="Список возможностей доступен только модератору."
            tone="warning"
          />
        </Card>
      ) : null}

      {decisionState.status === "error" ? (
        <Alert tone="error" title="Решение не применено" showIcon>
          {decisionState.error}
        </Alert>
      ) : null}

      {decisionState.status === "success" ? (
        <Alert tone="success" title="Решение применено" showIcon>
          Статус публикации обновлен в backend.
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <section className={`moderator-review-grid ${activeItem ? "moderator-review-grid--with-detail" : ""}`.trim()}>
          <Card className="moderator-panel moderator-panel--list moderator-fade-up moderator-fade-up--delay-2">
            <div className="moderator-panel__head moderator-panel__head--queue">
              <div className="moderator-panel__copy">
                <Tag tone="accent">Возможности</Tag>
                <h2 className="ui-type-h2">Список публикаций</h2>
                <p className="ui-type-body">Выберите карточку слева и примените решение модерации справа.</p>
              </div>
              <span className="moderator-panel__counter">{filteredItems.length}</span>
            </div>

            {filteredItems.length ? (
              <>
                <div className="moderator-table-shell moderator-table-shell--opportunities">
                  <div className="moderator-table moderator-table--opportunities">
                    <div className="moderator-table__header">
                      <span>Название</span>
                      <span>Компания</span>
                      <span>Тип</span>
                      <span>Дата</span>
                      <span>Статус</span>
                    </div>
                    <div className="moderator-table__body">
                      {filteredItems.map((item) => (
                        <OpportunityRow key={item.id} item={item} selected={item.id === selectedId} onSelect={handleOpportunitySelect} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="moderator-opportunity-compact-list">
                  {filteredItems.map((item) => (
                    <OpportunityCompactCard
                      key={item.id}
                      item={item}
                      selected={item.id === selectedId}
                      onSelect={handleOpportunitySelect}
                    />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState title="Публикации не найдены" description="Попробуйте изменить фильтр или поисковый запрос." tone="neutral" compact />
            )}
          </Card>

          {activeItem ? (
            <Card className="moderator-panel moderator-detail-card moderator-fade-up moderator-fade-up--delay-3">
              <div className="moderator-panel__copy">
                <h2 className="ui-type-h2">Детальная проверка</h2>
              </div>

              <div className="moderator-detail-surface">
                <div className="moderator-detail-surface__top">
                  <Tag>{translateOpportunityType(activeItem.opportunityType)}</Tag>
                  <ModeratorStatusBadge label={translateStatus(activeItem.moderationStatus)} tone={activeItem.moderationStatus} />
                </div>

                <div className="moderator-detail-surface__copy">
                  <h3 className="ui-type-h3">{activeItem.title}</h3>
                  <p className="ui-type-body moderator-detail-surface__company">{activeItem.companyName}</p>
                </div>

                <dl className="moderator-detail-facts">
                  <div>
                    <dt>Локация:</dt>
                    <dd>{getOpportunityLocation(activeItem)}</dd>
                  </div>
                  <div>
                    <dt>Дата публикации:</dt>
                    <dd>{formatDate(activeItem.publishAt)}</dd>
                  </div>
                  <div>
                    <dt>Дата окончания:</dt>
                    <dd>{formatDate(activeItem.expireAt)}</dd>
                  </div>
                </dl>

                <p className="ui-type-body moderator-detail-surface__description">
                  {activeItem.description || "Описание публикации пока не заполнено."}
                </p>

                <section className="moderator-detail-group">
                  <h4 className="ui-type-h3">Решение модерации</h4>
                  <ModerationDecisionSelect
                    value={decision}
                    options={MODERATION_DECISION_OPTIONS}
                    disabled={!activeItem}
                    busy={decisionState.status === "saving"}
                    onConfirm={handleDecisionSubmit}
                    getDialogProps={(option) => getOpportunityDecisionDialog(option, activeItem)}
                  />
                </section>
              </div>
            </Card>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
