import { useEffect, useMemo, useState } from "react";
import { getModerationUsers } from "../api/moderation";
import { ApiError } from "../lib/http";
import { Alert, Card, DashboardPageHeader, EmptyState, Loader, Tag } from "../shared/ui";
import { ModeratorFilterPill, ModeratorSearchBar, ModeratorStatusBadge } from "./shared";

const USER_FILTERS = [
  { value: "all", label: "Все" },
  { value: "candidate", label: "Соискатели" },
  { value: "company", label: "Работодатели" },
  { value: "moderator", label: "Модераторы" },
  { value: "verified", label: "Подтвержденные" },
];

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
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

function translateRole(role) {
  switch (role) {
    case "candidate":
      return "Соискатель";
    case "company":
      return "Работодатель";
    case "moderator":
      return "Модератор";
    default:
      return role || "Роль не указана";
  }
}

function getUserDisplayName(item) {
  const displayName = String(item?.displayName ?? "").trim();
  if (displayName) {
    return displayName;
  }

  const email = String(item?.email ?? "").trim();
  return email || "Пользователь";
}

function shouldShowUserEmail(item) {
  const email = String(item?.email ?? "").trim();
  return Boolean(email) && normalize(email) !== normalize(getUserDisplayName(item));
}

function UserRow({ item, selected, onSelect }) {
  return (
    <button type="button" className={`moderator-table__row ${selected ? "is-active" : ""}`.trim()} onClick={() => onSelect(item.id)}>
      <span className="moderator-table__cell moderator-table__cell--stack">
        <span className="moderator-table__title">{getUserDisplayName(item)}</span>
        {shouldShowUserEmail(item) ? <span className="moderator-table__meta">{item.email}</span> : null}
      </span>
      <span className="moderator-table__cell">{translateRole(item.role)}</span>
      <span className="moderator-table__cell">{formatDate(item.createdAt)}</span>
      <span className="moderator-table__cell moderator-table__cell--status">
        <ModeratorStatusBadge label={item.isVerified ? "Подтвержден" : "Не подтвержден"} tone={item.isVerified ? "approved" : "pending"} />
      </span>
    </button>
  );
}

export function ModeratorUsersApp() {
  const [state, setState] = useState({ status: "loading", items: [], error: null });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const items = await getModerationUsers(controller.signal);
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
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalize(query);

    return state.items.filter((item) => {
      const haystack = normalize([getUserDisplayName(item), item.email, item.role, translateRole(item.role)].join(" "));
      const matchesFilter =
        statusFilter === "all"
          ? true
          : statusFilter === "verified"
            ? item.isVerified
            : item.role === statusFilter;

      return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [query, state.items, statusFilter]);

  const activeItem = filteredItems.find((item) => item.id === selectedId) ?? filteredItems[0] ?? null;

  return (
    <>
      <DashboardPageHeader
        title="Пользователи платформы"
        description="Обзор состава платформы, ролей и статуса подтверждения профилей без лишних локальных заглушек."
      />

      <div className="moderator-toolbar-stack">
        <ModeratorSearchBar value={query} onChange={setQuery} placeholder="Поиск по имени, email или роли" />
        <div className="moderator-panel__filters moderator-fade-up moderator-fade-up--delay-1">
          {USER_FILTERS.map((filter) => (
            <ModeratorFilterPill
              key={filter.value}
              label={filter.label}
              active={filter.value === statusFilter}
              onClick={() => setStatusFilter(filter.value)}
            />
          ))}
        </div>
      </div>

      {state.status === "loading" ? <Loader label="Загружаем пользователей" surface /> : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить пользователей" showIcon>
          {state.error?.message ?? "Попробуйте повторить позже."}
        </Alert>
      ) : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Доступ ограничен"
            title="Нужна роль модератора"
            description="Список пользователей доступен только модератору."
            tone="warning"
          />
        </Card>
      ) : null}

      {state.status === "ready" ? (
        <section className="moderator-review-grid">
          <Card className="moderator-panel moderator-panel--list moderator-fade-up moderator-fade-up--delay-2">
            <div className="moderator-panel__head moderator-panel__head--queue">
              <div className="moderator-panel__copy">
                <Tag tone="accent">Пользователи</Tag>
                <h2 className="ui-type-h2">Список профилей</h2>
                <p className="ui-type-body">Просмотр состава платформы без локальных заглушек и несуществующих действий.</p>
              </div>
              <span className="moderator-panel__counter">{filteredItems.length}</span>
            </div>

            {filteredItems.length ? (
              <div className="moderator-table moderator-table--users">
                <div className="moderator-table__header">
                  <span>Имя</span>
                  <span>Роль</span>
                  <span>Дата</span>
                  <span>Статус</span>
                </div>
                <div className="moderator-table__body">
                  {filteredItems.map((item) => (
                    <UserRow key={item.id} item={item} selected={item.id === activeItem?.id} onSelect={setSelectedId} />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Пользователи не найдены" description="Попробуйте изменить фильтр или поисковый запрос." tone="neutral" compact />
            )}
          </Card>

          <Card className="moderator-panel moderator-detail-card moderator-fade-up moderator-fade-up--delay-3">
            <div className="moderator-panel__copy">
              <h2 className="ui-type-h2">Детали пользователя</h2>
            </div>

            {activeItem ? (
              <div className="moderator-detail-surface">
                <div className="moderator-detail-surface__top">
                  <Tag tone="accent">Профиль</Tag>
                  <ModeratorStatusBadge label={activeItem.isVerified ? "Подтвержден" : "Не подтвержден"} tone={activeItem.isVerified ? "approved" : "pending"} />
                </div>

                <div className="moderator-detail-surface__copy">
                  <h3 className="ui-type-h3">{getUserDisplayName(activeItem)}</h3>
                  {shouldShowUserEmail(activeItem) ? <p className="moderator-detail-surface__meta">{activeItem.email}</p> : null}
                </div>

                <dl className="moderator-detail-facts moderator-detail-facts--stack">
                  <div>
                    <dt>Роль</dt>
                    <dd>{translateRole(activeItem.role)}</dd>
                  </div>
                  <div>
                    <dt>Дата регистрации</dt>
                    <dd>{formatDate(activeItem.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Допуск ко входу</dt>
                    <dd>{activeItem.preVerify ? "Да" : "Нет"}</dd>
                  </div>
                  <div>
                    <dt>Подтверждение email</dt>
                    <dd>{activeItem.isVerified ? "Да" : "Нет"}</dd>
                  </div>
                </dl>

                <p className="ui-type-body moderator-detail-surface__description">
                  Для пользователей пока доступен только обзор данных. Управляющие действия не рендерятся, пока в backend не появится отдельный moderation endpoint.
                </p>
              </div>
            ) : (
              <EmptyState title="Пользователь не выбран" description="Выберите строку в таблице, чтобы открыть детали." tone="neutral" compact />
            )}
          </Card>
        </section>
      ) : null}
    </>
  );
}
