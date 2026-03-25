import { useEffect, useMemo, useState } from "react";
import { decideCompanyModeration, getModerationCompanies } from "../api/moderation";
import { ApiError } from "../lib/http";
import { Alert, Button, Card, EmptyState, Loader, Tag } from "../shared/ui";
import {
  ModeratorDecisionStack,
  ModeratorFilterPill,
  ModeratorPageIntro,
  ModeratorSearchBar,
  ModeratorStatusBadge,
} from "./shared";

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
        setSelectedId((current) => current ?? normalizedItems[0]?.id ?? null);
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

  const activeItem = filteredItems.find((item) => item.id === selectedId) ?? filteredItems[0] ?? null;

  async function handleDecisionSubmit() {
    if (!activeItem) {
      return;
    }

    setDecisionState({ status: "saving", error: "" });

    try {
      await decideCompanyModeration(activeItem.id, decision);
      setDecisionState({ status: "success", error: "" });
      setReloadKey((current) => current + 1);
    } catch (error) {
      setDecisionState({
        status: "error",
        error: error?.message ?? "Не удалось применить решение модерации.",
      });
    }
  }

  return (
    <>
      <ModeratorPageIntro
        title="Верификация компаний"
        description="Реальный список компаний из `/api/moderation/companies` и применение решений через `/api/moderation/companies/{id}/decision`."
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
                <h2 className="ui-type-h1">Список компаний</h2>
                <p className="ui-type-body-lg">Выберите компанию слева и примените решение в правой панели.</p>
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

          <Card className="moderator-panel moderator-detail-card moderator-fade-up moderator-fade-up--delay-3">
            <div className="moderator-panel__copy">
              <h2 className="ui-type-h1">Детальная проверка</h2>
            </div>

            {activeItem ? (
              <div className="moderator-detail-surface">
                <div className="moderator-detail-surface__top">
                  <Tag>Компания</Tag>
                  <ModeratorStatusBadge label={translateCompanyStatus(activeItem.verificationStatus)} tone={activeItem.verificationStatus} />
                </div>

                <div className="moderator-detail-surface__copy">
                  <h3 className="ui-type-h1">{activeItem.companyName}</h3>
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
                  <ModeratorDecisionStack
                    items={[
                      { key: "rejected", label: "Отклонить", tone: "reject", active: decision === "rejected", onClick: () => setDecision("rejected") },
                      { key: "revision", label: "На доработку", tone: "revision", active: decision === "revision", onClick: () => setDecision("revision") },
                      { key: "approved", label: "Одобрить", tone: "approve", active: decision === "approved", onClick: () => setDecision("approved") },
                    ]}
                  />
                </section>

                <Button className="moderator-detail-surface__submit" onClick={handleDecisionSubmit} disabled={decisionState.status === "saving"}>
                  {decisionState.status === "saving" ? "Применяем..." : "Применить решение"}
                </Button>
              </div>
            ) : (
              <EmptyState title="Компания не выбрана" description="Выберите строку в таблице, чтобы открыть детали." tone="neutral" compact />
            )}
          </Card>
        </section>
      ) : null}
    </>
  );
}

function itemOrZero(value) {
  return Number.isFinite(Number(value)) ? String(value) : "0";
}
