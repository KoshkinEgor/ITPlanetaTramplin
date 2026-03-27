import { useState } from "react";
import { Card, Tag } from "../components/ui";
import { LOG_FILTERS, LOG_ITEMS } from "./data";
import { ModeratorFilterPill, ModeratorFrame, ModeratorPageIntro, ModeratorSearchBar } from "./shared";

function normalize(value) {
  return String(value).trim().toLowerCase();
}

function LogItem({ item }) {
  return (
    <article className="moderator-activity-item">
      <div className="moderator-activity-item__top">
        <Tag>{item.type}</Tag>
        <span>{item.date}</span>
      </div>
      <div className="moderator-activity-item__copy">
        <h3 className="ui-type-h3">{item.title}</h3>
        <p className="ui-type-body">{item.description}</p>
      </div>
    </article>
  );
}

export function ModeratorLogsApp() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Все");

  const normalizedQuery = normalize(query);
  const visibleItems = LOG_ITEMS.filter((item) => {
    const haystack = normalize([item.type, item.title, item.description, item.date].join(" "));
    const matchesFilter = filter === "Все" ? true : item.filter === filter;
    return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
  });

  return (
    <ModeratorFrame activeKey="logs">
      <ModeratorPageIntro
        title="Логи платформы"
        description="Последние события модерации, системные уведомления и действия кураторов по разделам."
      />

      <div className="moderator-toolbar-stack">
        <ModeratorSearchBar value={query} onChange={setQuery} placeholder="Поиск по названию, действию или дате" />
        <div className="moderator-panel__filters moderator-fade-up moderator-fade-up--delay-1">
          {LOG_FILTERS.map((label) => (
            <ModeratorFilterPill key={label} label={label} active={label === filter} onClick={() => setFilter(label)} />
          ))}
        </div>
      </div>

      <Card className="moderator-panel moderator-fade-up moderator-fade-up--delay-2">
        <div className="moderator-panel__head">
          <Tag tone="accent">
            Журнал
          </Tag>
          <div className="moderator-panel__copy">
            <h2 className="ui-type-h1">Последние записи</h2>
            <p className="ui-type-body-lg">Быстрые действия работают прямо в строке, детальная проверка открывается справа.</p>
          </div>
        </div>

        <div className="moderator-activity-list">
          {visibleItems.map((item) => (
            <LogItem key={item.id} item={item} />
          ))}
        </div>
      </Card>
    </ModeratorFrame>
  );
}
