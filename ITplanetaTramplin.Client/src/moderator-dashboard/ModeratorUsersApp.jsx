import { useState } from "react";
import { Button, Card, Tag } from "../components/ui";
import { USER_FILTERS, USER_ITEMS } from "./data";
import { ModeratorDecisionStack, ModeratorFilterPill, ModeratorFrame, ModeratorPageIntro, ModeratorSearchBar, ModeratorStatusBadge } from "./shared";

function normalize(value) {
  return String(value).trim().toLowerCase();
}

function formatFullDate(value) {
  const [day, month, year] = String(value).split(".");
  const monthMap = {
    "01": "января",
    "02": "февраля",
    "03": "марта",
    "04": "апреля",
    "05": "мая",
    "06": "июня",
    "07": "июля",
    "08": "августа",
    "09": "сентября",
    "10": "октября",
    "11": "ноября",
    "12": "декабря",
  };

  return `${Number(day)} ${monthMap[month] ?? ""} ${year}`.trim();
}

function matchesFilter(item, filter) {
  if (filter === "Все") {
    return true;
  }

  if (filter === "Соискатели") {
    return item.roleKey === "candidate";
  }

  if (filter === "Работодатели") {
    return item.roleKey === "employer";
  }

  if (filter === "Заблокированы") {
    return item.statusKey === "blocked";
  }

  if (filter === "Удалены") {
    return item.statusKey === "deleted";
  }

  return item.status === filter;
}

function UserRow({ item, selected, onSelect }) {
  return (
    <button type="button" className={`moderator-table__row ${selected ? "is-active" : ""}`.trim()} onClick={() => onSelect(item.id)}>
      <span className="moderator-table__cell moderator-table__cell--title">{item.name}</span>
      <span className="moderator-table__cell">{item.role}</span>
      <span className="moderator-table__cell">{item.date}</span>
      <span className="moderator-table__cell moderator-table__cell--status">
        <ModeratorStatusBadge label={item.status} tone={item.statusKey} />
      </span>
    </button>
  );
}

export function ModeratorUsersApp() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Все");
  const [selectedId, setSelectedId] = useState(USER_ITEMS[0]?.id ?? null);
  const [decision, setDecision] = useState("open");

  const normalizedQuery = normalize(query);
  const filteredItems = USER_ITEMS.filter((item) => {
    const haystack = normalize([item.name, item.role, item.contextValue, item.summary].join(" "));
    return matchesFilter(item, statusFilter) && (!normalizedQuery || haystack.includes(normalizedQuery));
  });

  const activeItem =
    filteredItems.find((item) => item.id === selectedId) ??
    filteredItems[0] ??
    USER_ITEMS[0];

  return (
    <ModeratorFrame activeKey="users">
      <ModeratorPageIntro
        title="Соискатели и работодатели"
        description="Управление ролями, статусами и ограничениями аккаунтов с подтверждением критичных действий."
      />

      <div className="moderator-toolbar-stack">
        <ModeratorSearchBar value={query} onChange={setQuery} placeholder="Поиск по имени, роли или компании" />
        <div className="moderator-panel__filters moderator-fade-up moderator-fade-up--delay-1">
          {USER_FILTERS.map((label) => (
            <ModeratorFilterPill key={label} label={label} active={label === statusFilter} onClick={() => setStatusFilter(label)} />
          ))}
        </div>
      </div>

      <section className="moderator-review-grid">
        <Card className="moderator-panel moderator-panel--list moderator-fade-up moderator-fade-up--delay-2">
          <div className="moderator-panel__head moderator-panel__head--queue">
            <div className="moderator-panel__copy">
              <Tag tone="accent">
                Пользователи
              </Tag>
              <h2 className="ui-type-h1">Пользователи платформы</h2>
              <p className="ui-type-body-lg">Быстрые действия работают прямо в строке, детальная проверка открывается справа.</p>
            </div>
            <span className="moderator-panel__counter">{filteredItems.length}</span>
          </div>

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
        </Card>

        <Card className="moderator-panel moderator-detail-card moderator-fade-up moderator-fade-up--delay-3">
          <div className="moderator-panel__copy">
            <h2 className="ui-type-h1">Детали пользователя</h2>
          </div>

          {activeItem ? (
            <div className="moderator-detail-surface">
              <div className="moderator-detail-surface__top">
                <Tag tone="accent">
                  Профиль
                </Tag>
                <ModeratorStatusBadge label={activeItem.status} tone={activeItem.statusKey} />
              </div>

              <div className="moderator-detail-surface__copy">
                <h3 className="ui-type-h1">{activeItem.name}</h3>
              </div>

              <dl className="moderator-detail-facts moderator-detail-facts--stack">
                <div>
                  <dt>Роль</dt>
                  <dd>{activeItem.role}</dd>
                </div>
                <div>
                  <dt>{activeItem.contextLabel}</dt>
                  <dd>{activeItem.contextValue}</dd>
                </div>
                <div>
                  <dt>Последний вход</dt>
                  <dd>{activeItem.lastSeen}</dd>
                </div>
                <div>
                  <dt>Дата</dt>
                  <dd>{formatFullDate(activeItem.date)}</dd>
                </div>
              </dl>

              <p className="ui-type-body moderator-detail-surface__description">{activeItem.summary}</p>

              <section className="moderator-detail-group">
                <h4 className="ui-type-h3">Блок модерации</h4>
                <ModeratorDecisionStack
                  items={[
                    { key: "delete", label: "Удалить пользователя", tone: "reject", active: decision === "delete", onClick: () => setDecision("delete") },
                    { key: "block", label: "Блокировать пользователя", tone: "blocked", active: decision === "block", onClick: () => setDecision("block") },
                    { key: "open", label: "Открыть профиль", tone: "approve", active: decision === "open", onClick: () => setDecision("open") },
                  ]}
                />
              </section>

              <Button className="moderator-detail-surface__submit">Применить решение</Button>
            </div>
          ) : null}
        </Card>
      </section>
    </ModeratorFrame>
  );
}
