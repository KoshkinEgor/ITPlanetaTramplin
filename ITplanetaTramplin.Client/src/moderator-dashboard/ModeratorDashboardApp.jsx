import { useState } from "react";
import { Button, Card, StatusBadge, Tag } from "../components/ui";
import { ACTIVITY_FILTERS, ACTIVITY_ITEMS, DASHBOARD_METRICS, QUEUE_FILTERS, QUEUE_ITEMS, SHIFT_ITEMS } from "./data";
import {
  ModeratorFilterPill,
  ModeratorFrame,
  ModeratorMetricCard,
  ModeratorPageIntro,
  ModeratorSortControl,
} from "./shared";

function ActivityItem({ item }) {
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

function ShiftSummaryItem({ item }) {
  return (
    <article className="moderator-summary-item">
      <div className="moderator-summary-item__copy">
        <h3 className="ui-type-h3">{item.title}</h3>
        <p className="ui-type-body">{item.description}</p>
      </div>
      <StatusBadge label={item.status} tone="neutral" />
    </article>
  );
}

function QueueItem({ item }) {
  return (
    <article className="moderator-queue-item">
      <div className="moderator-queue-item__top">
        <Tag>{item.type}</Tag>
        <span>{item.date}</span>
      </div>

      <div className="moderator-queue-item__bottom">
        <div className="moderator-queue-item__copy">
          <h3 className="ui-type-h3">{item.title}</h3>
          <p className="ui-type-body">{item.description}</p>
        </div>

        <Button
          as="a"
          href={item.filter === "Верификация" ? "./moderator-companies.html" : "./moderator-opportunities.html"}
          variant="primary"
          className="moderator-queue-item__action"
        >
          Подробнее
        </Button>
      </div>
    </article>
  );
}

export function ModeratorDashboardApp() {
  const [activityFilter, setActivityFilter] = useState("Все");
  const [queueFilter, setQueueFilter] = useState("Все");

  const visibleActivityItems =
    activityFilter === "Все" ? ACTIVITY_ITEMS : ACTIVITY_ITEMS.filter((item) => item.filter === activityFilter);
  const visibleQueueItems = queueFilter === "Все" ? QUEUE_ITEMS : QUEUE_ITEMS.filter((item) => item.filter === queueFilter);

  return (
    <ModeratorFrame activeKey="dashboard">
      <ModeratorPageIntro
        title="Дашборд модерации"
        description="Общий список последних откликов по вакансиям и событиям с быстрым контекстом по статусу, роли и способу связи."
      />

      <section className="moderator-metrics">
        {DASHBOARD_METRICS.map((item, index) => (
          <ModeratorMetricCard key={item.title} item={item} delayIndex={index + 1} />
        ))}
      </section>

      <section className="moderator-main-grid">
        <Card className="moderator-panel moderator-panel--activity moderator-fade-up moderator-fade-up--delay-2">
          <div className="moderator-panel__head">
            <Tag tone="accent">
              Активность
            </Tag>
            <div className="moderator-panel__copy">
              <h2 className="ui-type-h1">Последние действия</h2>
              <p className="ui-type-body-lg">Здесь представлены последние изменения, которые нуждаются в проверке.</p>
            </div>
          </div>

          <div className="moderator-panel__filters">
            {ACTIVITY_FILTERS.map((label) => (
              <ModeratorFilterPill key={label} label={label} active={label === activityFilter} onClick={() => setActivityFilter(label)} />
            ))}
          </div>

          <ModeratorSortControl />

          <div className="moderator-activity-list">
            {visibleActivityItems.map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </div>
        </Card>

        <Card className="moderator-panel moderator-panel--summary moderator-fade-up moderator-fade-up--delay-3">
          <div className="moderator-panel__head">
            <Tag tone="accent">
              Фокус
            </Tag>
            <div className="moderator-panel__copy">
              <h2 className="ui-type-h1">Сводка смены</h2>
              <p className="ui-type-body-lg">Здесь представлены незавершенные задачи.</p>
            </div>
          </div>

          <div className="moderator-summary-list">
            {SHIFT_ITEMS.map((item) => (
              <ShiftSummaryItem key={item.title} item={item} />
            ))}
          </div>
        </Card>
      </section>

      <Card className="moderator-panel moderator-panel--queue moderator-fade-up moderator-fade-up--delay-3">
        <div className="moderator-panel__head moderator-panel__head--queue">
          <div className="moderator-panel__copy">
            <Tag tone="accent">
              Приоритет
            </Tag>
            <h2 className="ui-type-h1">Очередь задач</h2>
            <p className="ui-type-body-lg">Проверьте заявки, отправленные на проверку.</p>
          </div>

          <span className="moderator-panel__counter">16</span>
        </div>

        <div className="moderator-panel__queue-toolbar">
          <div className="moderator-panel__filters">
            {QUEUE_FILTERS.map((label) => (
              <ModeratorFilterPill key={label} label={label} active={label === queueFilter} onClick={() => setQueueFilter(label)} />
            ))}
          </div>

          <ModeratorSortControl />
        </div>

        <div className="moderator-queue-list">
          {visibleQueueItems.map((item) => (
            <QueueItem key={item.id} item={item} />
          ))}
        </div>
      </Card>
    </ModeratorFrame>
  );
}
