import { useState } from "react";
import { Card, StatusBadge, Tag } from "../components/ui";
import { REPORT_ITEMS } from "./data";
import { ModeratorDecisionButton, ModeratorFrame, ModeratorPageIntro } from "./shared";

function ReportCard({ item }) {
  return (
    <Card className="moderator-report-card moderator-fade-up moderator-fade-up--delay-2">
      <div className="moderator-report-card__head">
        <StatusBadge tone="warning">
          Жалоба
        </StatusBadge>
        <span className="moderator-report-card__count">{item.count}</span>
      </div>

      <div className="moderator-report-card__copy">
        <h2 className="ui-type-h1">{item.title}</h2>
        <div className="moderator-report-card__meta">
          <Tag>{item.reason}</Tag>
          <Tag>{item.date}</Tag>
        </div>
        <p className="ui-type-body-lg moderator-report-card__description">{item.description}</p>
      </div>

      <div className="moderator-report-card__actions">
        <ModeratorDecisionButton label="Заблокировать" tone="blocked" className="moderator-report-card__action" />
        <ModeratorDecisionButton label="Игнорировать" tone="neutral" className="moderator-report-card__action" />
        <ModeratorDecisionButton label="Удалить контент" tone="reject" className="moderator-report-card__action" />
      </div>
    </Card>
  );
}

export function ModeratorReportsApp() {
  const [sortBy, setSortBy] = useState("count");

  const visibleItems = [...REPORT_ITEMS].sort((left, right) => {
    if (sortBy === "date") {
      return right.timestamp - left.timestamp;
    }

    return right.count - left.count || right.timestamp - left.timestamp;
  });

  return (
    <ModeratorFrame activeKey="reports">
      <ModeratorPageIntro title="Работа с жалобами" />

      <Card className="moderator-panel moderator-panel--reports-summary moderator-fade-up moderator-fade-up--delay-1">
        <div className="moderator-panel__head moderator-panel__head--queue">
          <div className="moderator-panel__copy">
            <h2 className="ui-type-h1">Очередь жалоб</h2>
            <p className="ui-type-body-lg">Отсортировано {visibleItems.length} карточек жалоб.</p>
          </div>
          <span className="moderator-panel__counter moderator-panel__counter--wide">{visibleItems.length}</span>
        </div>

        <div className="moderator-segmented">
          <button
            type="button"
            className={`moderator-segmented__button ${sortBy === "count" ? "is-active" : ""}`.trim()}
            onClick={() => setSortBy("count")}
          >
            По количеству
          </button>
          <button
            type="button"
            className={`moderator-segmented__button ${sortBy === "date" ? "is-active" : ""}`.trim()}
            onClick={() => setSortBy("date")}
          >
            По дате
          </button>
        </div>
      </Card>

      <section className="moderator-report-list">
        {visibleItems.map((item) => (
          <ReportCard key={item.id} item={item} />
        ))}
      </section>
    </ModeratorFrame>
  );
}
