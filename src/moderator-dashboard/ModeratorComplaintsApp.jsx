import { useEffect, useMemo, useState } from "react";
import { decideComplaintModeration, getModerationComplaints } from "../api/moderation";
import { Alert, Card, ComplaintCard, DashboardPageHeader, EmptyState, Loader, SegmentedControl } from "../shared/ui";
import { formatComplaintDate, getComplaintTimestamp, moderatorComplaintActionOptions } from "./complaints.mock";

const SORT_OPTIONS = [
  { value: "count", label: "По количеству" },
  { value: "date", label: "По дате" },
];

function readValue(item, key, fallback = "") {
  return item?.[key] ?? item?.[`${key[0].toUpperCase()}${key.slice(1)}`] ?? fallback;
}

function mapComplaint(item) {
  const opportunityTitle = readValue(item, "opportunityTitle", readValue(item, "title", "Жалоба"));
  const companyName = readValue(item, "companyName", "");
  const reason = readValue(item, "reason", "Жалоба");

  return {
    id: readValue(item, "id"),
    title: opportunityTitle,
    reason,
    createdAt: readValue(item, "createdAt"),
    description: readValue(item, "description") || (companyName ? `Компания: ${companyName}` : ""),
    count: Number(readValue(item, "count", 1)) || 1,
    status: readValue(item, "status", "pending"),
    companyName,
  };
}

function sortComplaints(items, sortMode) {
  return [...items].sort((left, right) => {
    if (sortMode === "date") {
      return getComplaintTimestamp(right.createdAt) - getComplaintTimestamp(left.createdAt) || right.count - left.count;
    }

    return right.count - left.count || getComplaintTimestamp(right.createdAt) - getComplaintTimestamp(left.createdAt);
  });
}

function getDefaultAction(status) {
  const normalizedStatus = String(status ?? "").trim().toLowerCase();

  if (normalizedStatus === "dismissed") {
    return "dismiss";
  }

  if (normalizedStatus === "upheld") {
    return "block";
  }

  return "review";
}

export function ModeratorComplaintsApp() {
  const [sortMode, setSortMode] = useState("count");
  const [state, setState] = useState({ status: "loading", items: [], error: null });
  const [actionById, setActionById] = useState({});
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setState((current) => ({ ...current, status: "loading", error: null }));
        const items = await getModerationComplaints(controller.signal);
        if (controller.signal.aborted) {
          return;
        }

        const mappedItems = (Array.isArray(items) ? items : []).map(mapComplaint);
        setState({ status: "ready", items: mappedItems, error: null });
        setActionById(Object.fromEntries(mappedItems.map((item) => [item.id, getDefaultAction(item.status)])));
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({ status: "error", items: [], error });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const complaints = useMemo(() => sortComplaints(state.items, sortMode), [sortMode, state.items]);

  async function handleActionChange(item, nextValue) {
    setActionById((current) => ({ ...current, [item.id]: nextValue }));
    setBusyId(item.id);

    try {
      await decideComplaintModeration(item.id, { status: nextValue });
      setState((current) => ({
        ...current,
        items: current.items.map((entry) =>
          entry.id === item.id ? { ...entry, status: nextValue === "dismiss" ? "dismissed" : nextValue === "block" ? "upheld" : "in_review" } : entry
        ),
      }));
    } catch (error) {
      setState((current) => ({ ...current, status: "error", error }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <DashboardPageHeader
        title="Работа с жалобами"
        description="Реальная очередь жалоб по публикациям: повторяющиеся обращения группируются по причине и объекту."
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

      {state.status === "loading" ? <Loader label="Загружаем жалобы" surface /> : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить или обновить жалобы" showIcon>
          {state.error?.message ?? "Попробуйте повторить позже."}
        </Alert>
      ) : null}

      {complaints.length ? (
        <section className="moderator-complaints-list" aria-label="Очередь жалоб">
          {complaints.map((item, index) => (
            <ComplaintCard
              key={item.id}
              size="md"
              title={item.title}
              meta={[item.reason, item.companyName, formatComplaintDate(item.createdAt)].filter(Boolean)}
              description={item.description}
              count={item.count}
              actionOptions={moderatorComplaintActionOptions}
              actionValue={actionById[item.id] ?? getDefaultAction(item.status)}
              onActionChange={(nextValue) => handleActionChange(item, nextValue)}
              actionDisabled={busyId === item.id}
              className={`moderator-fade-up moderator-fade-up--delay-${Math.min(index + 1, 3)}`.trim()}
              data-testid={`moderator-complaint-card-${item.id}`}
            />
          ))}
        </section>
      ) : state.status === "ready" ? (
        <Card>
          <EmptyState title="Жалобы не найдены" description="Когда пользователи отправят жалобы, они появятся в этой очереди." tone="neutral" />
        </Card>
      ) : null}
    </>
  );
}
