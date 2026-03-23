import { useState } from "react";
import { Button, Card, StatusBadge, Tag } from "../components/ui";
import { COMPANY_FILTERS, COMPANY_ITEMS } from "./data";
import {
  ModeratorDecisionStack,
  ModeratorFilterPill,
  ModeratorFrame,
  ModeratorPageIntro,
  ModeratorSearchBar,
  ModeratorStatusBadge,
} from "./shared";

function normalize(value) {
  return String(value).trim().toLowerCase();
}

function CompanyRow({ item, selected, onSelect }) {
  return (
    <button type="button" className={`moderator-table__row ${selected ? "is-active" : ""}`.trim()} onClick={() => onSelect(item.id)}>
      <span className="moderator-table__cell moderator-table__cell--title">{item.name}</span>
      <span className="moderator-table__cell">{item.email}</span>
      <span className="moderator-table__cell">{item.site}</span>
      <span className="moderator-table__cell">{item.date}</span>
      <span className="moderator-table__cell moderator-table__cell--status">
        <ModeratorStatusBadge label={item.status} tone={item.statusKey} />
      </span>
    </button>
  );
}

export function ModeratorCompaniesApp() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Все");
  const [selectedId, setSelectedId] = useState(COMPANY_ITEMS[0]?.id ?? null);
  const [decision, setDecision] = useState("approve");

  const normalizedQuery = normalize(query);
  const filteredItems = COMPANY_ITEMS.filter((item) => {
    const matchesFilter = statusFilter === "Все" ? true : item.status === statusFilter;
    const haystack = normalize([item.name, item.email, item.site, item.socials].join(" "));
    return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
  });

  const activeItem =
    filteredItems.find((item) => item.id === selectedId) ??
    filteredItems[0] ??
    COMPANY_ITEMS[0];

  return (
    <ModeratorFrame activeKey="companies">
      <ModeratorPageIntro
        title="Верификация компаний"
        description="Проверка сайта, домена, контактов и документов перед публикацией компании на платформе."
      />

      <div className="moderator-toolbar-stack">
        <ModeratorSearchBar value={query} onChange={setQuery} placeholder="Поиск по названию, сайту или домену" />
        <div className="moderator-panel__filters moderator-fade-up moderator-fade-up--delay-1">
          {COMPANY_FILTERS.map((label) => (
            <ModeratorFilterPill key={label} label={label} active={label === statusFilter} onClick={() => setStatusFilter(label)} />
          ))}
        </div>
      </div>

      <section className="moderator-review-grid">
        <Card className="moderator-panel moderator-panel--list moderator-fade-up moderator-fade-up--delay-2">
          <div className="moderator-panel__head moderator-panel__head--queue">
            <div className="moderator-panel__copy">
              <Tag tone="accent">
                Верификация
              </Tag>
              <h2 className="ui-type-h1">Верификация</h2>
              <p className="ui-type-body-lg">Быстрые действия работают прямо в строке, детальная проверка открывается справа.</p>
            </div>
            <span className="moderator-panel__counter">{filteredItems.length}</span>
          </div>

          <div className="moderator-table moderator-table--companies">
            <div className="moderator-table__header">
              <span>Название</span>
              <span>Почта</span>
              <span>Сайт</span>
              <span>Дата</span>
              <span>Статус</span>
            </div>
            <div className="moderator-table__body">
              {filteredItems.map((item) => (
                <CompanyRow key={item.id} item={item} selected={item.id === activeItem?.id} onSelect={setSelectedId} />
              ))}
            </div>
          </div>
        </Card>

        <Card className="moderator-panel moderator-detail-card moderator-fade-up moderator-fade-up--delay-3">
          <div className="moderator-panel__copy">
            <h2 className="ui-type-h1">Детальная проверка</h2>
          </div>

          {activeItem ? (
            <div className="moderator-detail-surface">
              <div className="moderator-detail-surface__top">
                <Tag>Компания</Tag>
                <ModeratorStatusBadge label={activeItem.status} tone={activeItem.statusKey} />
              </div>

              <div className="moderator-detail-surface__copy">
                <h3 className="ui-type-h1">{activeItem.name}</h3>
                <p className="ui-type-body moderator-detail-surface__description">{activeItem.description}</p>
              </div>

              <dl className="moderator-detail-facts moderator-detail-facts--stack">
                <div>
                  <dt>Сайт</dt>
                  <dd>{activeItem.site}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{activeItem.email}</dd>
                </div>
                <div>
                  <dt>Соцсети</dt>
                  <dd>{activeItem.socials}</dd>
                </div>
                <div>
                  <dt>Документы</dt>
                  <dd>{activeItem.documents}</dd>
                </div>
              </dl>

              <p className="ui-type-body moderator-detail-surface__description">{activeItem.detailNote}</p>

              <section className="moderator-detail-group">
                <h4 className="ui-type-h3">Проверка данных</h4>
                <div className="moderator-check-stack">
                  {activeItem.checks.map((item) => (
                    <StatusBadge key={item.label} label={item.label} tone={item.state} className="moderator-check-item" />
                  ))}
                </div>
              </section>

              <section className="moderator-detail-group">
                <h4 className="ui-type-h3">Блок модерации</h4>
                <ModeratorDecisionStack
                  items={[
                    { key: "reject", label: "Отклонить", tone: "reject", active: decision === "reject", onClick: () => setDecision("reject") },
                    { key: "revision", label: "На доработку", tone: "revision", active: decision === "revision", onClick: () => setDecision("revision") },
                    { key: "approve", label: "Одобрить", tone: "approve", active: decision === "approve", onClick: () => setDecision("approve") },
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
