import { useState } from "react";
import { Button, Card, Tag } from "../components/ui";
import { MODERATION_FILTERS, MODERATION_ITEMS } from "./data";
import {
  ModeratorDecisionStack,
  ModeratorFilterPill,
  ModeratorFrame,
  ModeratorMediaCard,
  ModeratorPageIntro,
  ModeratorSearchBar,
  ModeratorStatusBadge,
} from "./shared";

function normalize(value) {
  return String(value).trim().toLowerCase();
}

function OpportunityRow({ item, selected, onSelect }) {
  return (
    <button type="button" className={`moderator-table__row ${selected ? "is-active" : ""}`.trim()} onClick={() => onSelect(item.id)}>
      <span className="moderator-table__cell moderator-table__cell--title">{item.title}</span>
      <span className="moderator-table__cell">{item.company}</span>
      <span className="moderator-table__cell">
        <Tag>{item.type}</Tag>
      </span>
      <span className="moderator-table__cell">{item.date}</span>
      <span className="moderator-table__cell moderator-table__cell--status">
        <ModeratorStatusBadge label={item.status} tone={item.statusKey} />
      </span>
    </button>
  );
}

export function ModeratorOpportunitiesApp() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Все");
  const [selectedId, setSelectedId] = useState(MODERATION_ITEMS[0]?.id ?? null);
  const [decision, setDecision] = useState("approve");

  const normalizedQuery = normalize(query);
  const filteredItems = MODERATION_ITEMS.filter((item) => {
    const matchesFilter = statusFilter === "Все" ? true : item.status === statusFilter;
    const haystack = normalize([item.title, item.company, item.type, item.tags.join(" ")].join(" "));
    return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
  });

  const activeItem =
    filteredItems.find((item) => item.id === selectedId) ??
    filteredItems[0] ??
    MODERATION_ITEMS[0];

  return (
    <ModeratorFrame activeKey="opportunities">
      <ModeratorPageIntro
        title="Модерация возможностей"
        description="Проверка вакансий, стажировок и мероприятий с быстрыми решениями и детальной карточкой."
      />

      <div className="moderator-toolbar-stack">
        <ModeratorSearchBar value={query} onChange={setQuery} placeholder="Поиск по названию, компании или тегам" />
        <div className="moderator-panel__filters moderator-fade-up moderator-fade-up--delay-1">
          {MODERATION_FILTERS.map((label) => (
            <ModeratorFilterPill key={label} label={label} active={label === statusFilter} onClick={() => setStatusFilter(label)} />
          ))}
        </div>
      </div>

      <section className="moderator-review-grid">
        <Card className="moderator-panel moderator-panel--list moderator-fade-up moderator-fade-up--delay-2">
          <div className="moderator-panel__head moderator-panel__head--queue">
            <div className="moderator-panel__copy">
              <Tag tone="accent">
                Возможности
              </Tag>
              <h2 className="ui-type-h1">Список возможностей</h2>
              <p className="ui-type-body-lg">Быстрые действия работают прямо в строке, детальная проверка открывается справа.</p>
            </div>
            <span className="moderator-panel__counter">{filteredItems.length}</span>
          </div>

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
                <OpportunityRow key={item.id} item={item} selected={item.id === activeItem?.id} onSelect={setSelectedId} />
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
                <Tag>{activeItem.type}</Tag>
                <ModeratorStatusBadge label={activeItem.status} tone={activeItem.statusKey} />
              </div>

              <div className="moderator-detail-surface__copy">
                <h3 className="ui-type-h1">{activeItem.title}</h3>
                <p className="ui-type-body-lg moderator-detail-surface__company">{activeItem.company}</p>
              </div>

              <dl className="moderator-detail-facts">
                <div>
                  <dt>Формат:</dt>
                  <dd>{activeItem.format}</dd>
                </div>
                <div>
                  <dt>Зарплата:</dt>
                  <dd>{activeItem.salary}</dd>
                </div>
                <div>
                  <dt>Дата:</dt>
                  <dd>{activeItem.publishedAt}</dd>
                </div>
              </dl>

              <p className="ui-type-body moderator-detail-surface__description">{activeItem.description}</p>

              <div className="moderator-detail-tags">
                {activeItem.tags.map((tag) => (
                  <Tag key={tag} tone="accent">
                    {tag}
                  </Tag>
                ))}
              </div>

              <section className="moderator-detail-group">
                <h4 className="ui-type-h3">Медиа</h4>
                <div className="moderator-detail-media">
                  {activeItem.media.map((item) => (
                    <ModeratorMediaCard key={item} label={item} />
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
