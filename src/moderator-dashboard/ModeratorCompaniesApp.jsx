import { useEffect, useMemo, useState } from "react";
import { decideCompanyModeration, getModerationCompanies } from "../api/moderation";
import { ApiError } from "../lib/http";
import { Alert, Card, DashboardPageHeader, EmptyState, Loader, Modal, ModerationDecisionSelect, Tag } from "../shared/ui";
import { ModeratorFilterPill, ModeratorSearchBar, ModeratorStatusBadge } from "./shared";
import { MODERATION_DECISION_OPTIONS } from "./moderationDecisionOptions";

const COMPANY_FILTERS = [
  { value: "all", label: "Все" },
  { value: "pending", label: "На проверке" },
  { value: "approved", label: "Подтверждены" },
  { value: "revision", label: "Доработка" },
  { value: "rejected", label: "Отклонены" },
];

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function translateCompanyStatus(status) {
  switch (status) {
    case "approved":
      return "Подтверждена";
    case "revision":
      return "Доработка";
    case "rejected":
      return "Отклонена";
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

function getCompanyDecisionDialog(option, item) {
  const actionLabelByDecision = {
    approved: "Одобрить компанию",
    revision: "Отправить компанию на доработку",
    rejected: "Отклонить компанию",
  };

  const descriptionByDecision = item?.companyName
    ? {
        approved: `Компания «${item.companyName}» будет подтверждена сразу после подтверждения действия.`,
        revision: `Компания «${item.companyName}» вернется на доработку после подтверждения действия.`,
        rejected: `Компания «${item.companyName}» получит статус «Отклонена» после подтверждения действия.`,
      }
    : {
        approved: "Выбранная компания будет подтверждена сразу после подтверждения действия.",
        revision: "Выбранная компания вернется на доработку после подтверждения действия.",
        rejected: "Выбранная компания получит статус «Отклонена» после подтверждения действия.",
      };

  return {
    actionLabel: actionLabelByDecision[option.value] ?? option.label,
    question: "Вы уверены?",
    description: descriptionByDecision[option.value] ?? "Изменение будет применено после подтверждения.",
    confirmLabel: option.confirmationButtonLabel ?? option.label,
    reasonLabel: option.value === "approved" ? undefined : "Причина отказа",
    reasonPlaceholder:
      option.value === "revision"
        ? "Например, не подтвержден домен компании"
        : option.value === "rejected"
          ? "Например, указаны некорректные юридические данные"
          : undefined,
    reasonResetLabel: option.value === "approved" ? undefined : "Сбросить",
  };
}

function CompanyRow({ item, selected, onSelect }) {
  return (
    <button type="button" className={`moderator-table__row ${selected ? "is-active" : ""}`.trim()} onClick={() => onSelect(item.id)}>
      <span className="moderator-table__cell moderator-table__cell--title">{item.companyName}</span>
      <span className="moderator-table__cell">{item.email}</span>
      <span className="moderator-table__cell">{item.inn || "ИНН не указан"}</span>
      <span className="moderator-table__cell">{formatDate(item.createdAt)}</span>
      <span className="moderator-table__cell moderator-table__cell--status">
        <ModeratorStatusBadge label={translateCompanyStatus(item.verificationStatus)} tone={item.verificationStatus} />
      </span>
    </button>
  );
}

export function ModeratorCompaniesApp() {
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
        const items = await getModerationCompanies(controller.signal);
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
      const haystack = normalize([item.companyName, item.email, item.inn, item.legalAddress, item.description].join(" "));
      const matchesFilter = statusFilter === "all" ? true : item.verificationStatus === statusFilter;
      return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [query, state.items, statusFilter]);

  const activeItem = filteredItems.find((item) => item.id === selectedId) ?? null;

  async function handleDecisionSubmit(nextDecision) {
    if (!activeItem) {
      return;
    }

    setDecisionState({ status: "saving", error: "" });

    try {
      await decideCompanyModeration(activeItem.id, nextDecision);
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
        title="Верификация компаний"
        description="Проверка профиля работодателя, домена, юридических данных и итогового статуса в одном рабочем потоке."
      />

      <div className="moderator-toolbar-stack">
        <ModeratorSearchBar value={query} onChange={setQuery} placeholder="Поиск по названию, email, ИНН или адресу" />
        <div className="moderator-panel__filters moderator-fade-up moderator-fade-up--delay-1">
          {COMPANY_FILTERS.map((filter) => (
            <ModeratorFilterPill
              key={filter.value}
              label={filter.label}
              active={filter.value === statusFilter}
              onClick={() => setStatusFilter(filter.value)}
            />
          ))}
        </div>
      </div>

      {state.status === "loading" ? <Loader label="Загружаем компании" surface /> : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить компании" showIcon>
          {state.error?.message ?? "Попробуйте повторить позже."}
        </Alert>
      ) : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Доступ ограничен"
            title="Нужна роль модератора"
            description="Список компаний доступен только модератору."
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
          Статус компании обновлен в backend.
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <section className="moderator-review-grid">
          <Card className="moderator-panel moderator-panel--list moderator-fade-up moderator-fade-up--delay-2">
            <div className="moderator-panel__head moderator-panel__head--queue">
              <div className="moderator-panel__copy">
                <Tag tone="accent">Компании</Tag>
                <h2 className="ui-type-h2">Список компаний</h2>
                <p className="ui-type-body">Выберите компанию из списка, чтобы открыть детальную проверку в модальном окне.</p>
              </div>
              <span className="moderator-panel__counter">{filteredItems.length}</span>
            </div>

            {filteredItems.length ? (
              <div className="moderator-table moderator-table--companies">
                <div className="moderator-table__header">
                  <span>Название</span>
                  <span>Email</span>
                  <span>ИНН</span>
                  <span>Дата</span>
                  <span>Статус</span>
                </div>
                <div className="moderator-table__body">
                  {filteredItems.map((item) => (
                    <CompanyRow key={item.id} item={item} selected={item.id === activeItem?.id} onSelect={setSelectedId} />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Компании не найдены" description="Попробуйте изменить фильтр или поисковый запрос." tone="neutral" compact />
            )}
          </Card>

        </section>
      ) : null}

      <Modal
        open={Boolean(activeItem)}
        onClose={() => setSelectedId(null)}
        title="Детальная проверка"
        description="Проверьте данные компании и примените решение модерации."
        size="lg"
        closeLabel="Закрыть окно проверки компании"
        className="moderator-company-modal"
      >
        {activeItem ? (
          <div className="moderator-detail-surface moderator-detail-surface--modal">
            <div className="moderator-detail-surface__top">
              <Tag>Компания</Tag>
              <ModeratorStatusBadge label={translateCompanyStatus(activeItem.verificationStatus)} tone={activeItem.verificationStatus} />
            </div>

            <div className="moderator-detail-surface__copy">
              <h3 className="ui-type-h3">{activeItem.companyName}</h3>
              <p className="ui-type-body moderator-detail-surface__description">
                {activeItem.description || "Описание компании пока не заполнено."}
              </p>
            </div>

            <dl className="moderator-detail-facts moderator-detail-facts--stack">
              <div>
                <dt>Email</dt>
                <dd>{activeItem.email}</dd>
              </div>
              <div>
                <dt>ИНН</dt>
                <dd>{activeItem.inn || "Не указан"}</dd>
              </div>
              <div>
                <dt>Адрес</dt>
                <dd>{activeItem.legalAddress || "Не указан"}</dd>
              </div>
              <div>
                <dt>Метод верификации</dt>
                <dd>{activeItem.verificationMethod || "Не указан"}</dd>
              </div>
              <div>
                <dt>Данные верификации</dt>
                <dd>{activeItem.verificationData || "Не указаны"}</dd>
              </div>
              <div>
                <dt>Публикации</dt>
                <dd>{itemOrZero(activeItem.opportunitiesCount)}</dd>
              </div>
            </dl>

            <section className="moderator-detail-group">
              <h4 className="ui-type-h3">Решение модерации</h4>
              <ModerationDecisionSelect
                value={decision}
                options={MODERATION_DECISION_OPTIONS}
                disabled={!activeItem}
                busy={decisionState.status === "saving"}
                onConfirm={handleDecisionSubmit}
                getDialogProps={(option) => getCompanyDecisionDialog(option, activeItem)}
              />
            </section>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function itemOrZero(value) {
  return Number.isFinite(Number(value)) ? String(value) : "0";
}
