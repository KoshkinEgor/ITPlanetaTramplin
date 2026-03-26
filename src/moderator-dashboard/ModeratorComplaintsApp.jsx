import { useMemo, useState } from "react";
import { Card, ComplaintCard, DashboardPageHeader, EmptyState, SegmentedControl } from "../shared/ui";
import { formatComplaintDate, getComplaintTimestamp, moderatorComplaintActionOptions, moderatorComplaintItems } from "./complaints.mock";

const SORT_OPTIONS = [
  { value: "count", label: "По количеству" },
  { value: "date", label: "По дате" },
];

function sortComplaints(items, sortMode) {
  return [...items].sort((left, right) => {
    if (sortMode === "date") {
      return getComplaintTimestamp(right.createdAt) - getComplaintTimestamp(left.createdAt) || right.count - left.count;
    }

    return right.count - left.count || getComplaintTimestamp(right.createdAt) - getComplaintTimestamp(left.createdAt);
  });
}

export function ModeratorComplaintsApp() {
  const [sortMode, setSortMode] = useState("count");
  const [actionById, setActionById] = useState(() =>
    Object.fromEntries(moderatorComplaintItems.map((item) => [item.id, moderatorComplaintActionOptions[0]?.value ?? ""]))
  );

  const complaints = useMemo(() => sortComplaints(moderatorComplaintItems, sortMode), [sortMode]);

  return (
    <>
      <DashboardPageHeader
        title="Работа с жалобами"
        description="Группировка повторяющихся жалоб по объектам и быстрая передача кейсов в очередь модерации."
      />

      <Card className="moderator-panel moderator-complaints-summary moderator-fade-up moderator-fade-up--delay-1">
        <div className="moderator-panel__head moderator-panel__head--queue moderator-complaints-summary__head">
          <div className="moderator-panel__copy">
            <h2 className="ui-type-h2">Очередь жалоб</h2>
            <p className="ui-type-body">Отсортировано {complaints.length} карточек жалоб.</p>
          </div>
          <span className="moderator-panel__counter moderator-panel__counter--wide">{complaints.length}</span>
        </div>

        <div className="moderator-complaints-summary__controls">
          <SegmentedControl
            items={SORT_OPTIONS}
            value={sortMode}
            onChange={setSortMode}
            stretch
            className="moderator-complaints-summary__segmented"
            ariaLabel="Сортировка очереди жалоб"
          />
        </div>
      </Card>

      {complaints.length ? (
        <section className="moderator-complaints-list" aria-label="Очередь жалоб">
          {complaints.map((item, index) => (
            <ComplaintCard
              key={item.id}
              size="md"
              title={item.title}
              meta={[item.reason, formatComplaintDate(item.createdAt)]}
              description={item.description}
              count={item.count}
              actionOptions={moderatorComplaintActionOptions}
              actionValue={actionById[item.id]}
              onActionChange={(nextValue) =>
                setActionById((current) => ({
                  ...current,
                  [item.id]: nextValue,
                }))
              }
              className={`moderator-fade-up moderator-fade-up--delay-${Math.min(index + 1, 3)}`.trim()}
              data-testid={`moderator-complaint-card-${item.id}`}
            />
          ))}
        </section>
      ) : (
        <Card>
          <EmptyState title="Жалобы не найдены" description="Когда в очереди появятся новые репорты, они будут показаны в этом списке." tone="neutral" />
        </Card>
      )}
    </>
  );
}
