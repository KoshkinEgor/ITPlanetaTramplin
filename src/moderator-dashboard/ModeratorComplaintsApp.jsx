import { useEffect, useMemo, useRef, useState } from "react";
import { decideComplaintModeration, getModerationComplaints, getModeratorSettings } from "../api/moderation";
import { Alert, Card, ComplaintCard, DashboardPageHeader, EmptyState, Loader, SegmentedControl, Switch } from "../shared/ui";
import { formatComplaintDate, getComplaintTimestamp, moderatorComplaintActionOptions } from "./complaints.mock";

const SORT_OPTIONS = [
  { value: "count", label: "По количеству" },
  { value: "date", label: "По дате" },
];

function readValue(item, key, fallback = "") {
  return item?.[key] ?? item?.[`${key[0].toUpperCase()}${key.slice(1)}`] ?? fallback;
}

const COMPLAINT_REASON_LABELS = {
  spam: "Спам или мошенничество",
  incorrect_data: "Некорректная информация",
  contacts: "Проблема с контактами",
  other: "Другое",
};

function getLocalizedReason(reason) {
  return COMPLAINT_REASON_LABELS[reason] || reason;
}

function mapComplaint(item) {
  const opportunityTitle = readValue(item, "opportunityTitle", readValue(item, "title", "Жалоба"));
  const companyName = readValue(item, "companyName", "");
  const reasonKey = readValue(item, "reason", "other");
  const reason = getLocalizedReason(reasonKey);

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
  const [showClosed, setShowClosed] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const decidedIdsRef = useRef(new Set());
  const includeClosedRef = useRef(false);
  const includeDismissedRef = useRef(false);

  // Load moderator settings once on mount
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadSettings() {
      try {
        const settingsPayload = await getModeratorSettings(controller.signal);
        if (!active) return;
        const settings = settingsPayload?.settings ?? settingsPayload?.Settings ?? {};
        const queueSettings = settings.queueSettings ?? settings.QueueSettings ?? {};
        setShowClosed(!!(queueSettings.includeClosedComplaints ?? queueSettings.IncludeClosedComplaints));
        setShowDismissed(!!(queueSettings.includeDismissedComplaints ?? queueSettings.IncludeDismissedComplaints));
      } catch (e) {
        // default fallback
      } finally {
        if (active) {
          setSettingsLoaded(true);
        }
      }
    }

    loadSettings();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!settingsLoaded) {
      return;
    }

    let active = true;
    let controller = new AbortController();

    includeClosedRef.current = showClosed;
    includeDismissedRef.current = showDismissed;

    async function load(isInitial = false) {
      if (isInitial) {
        setState((current) => ({ ...current, status: "loading", error: null }));
      }
      try {
        const items = await getModerationComplaints(
          { includeClosed: showClosed, includeDismissed: showDismissed },
          controller.signal
        );
        if (!active) {
          return;
        }

        const mappedItems = (Array.isArray(items) ? items : []).map(mapComplaint);
        const filteredItems = mappedItems.filter((item) => {
          if (decidedIdsRef.current.has(item.id)) {
            if (item.status === "upheld" && showClosed) {
              return true;
            }
            if (item.status === "dismissed" && showDismissed) {
              return true;
            }
            return false;
          }
          return true;
        });

        setState({ status: "ready", items: filteredItems, error: null });
        setActionById((prev) => {
          const next = {};
          for (const item of filteredItems) {
            next[item.id] = prev[item.id] ?? getDefaultAction(item.status);
          }
          return next;
        });
      } catch (error) {
        if (!active) {
          return;
        }
        if (isInitial) {
          setState({ status: "error", items: [], error });
        }
      }
    }

    load(true);

    const intervalId = setInterval(() => {
      load(false);
    }, 5000);

    return () => {
      active = false;
      controller.abort();
      clearInterval(intervalId);
    };
  }, [showClosed, showDismissed, settingsLoaded]);

  const complaints = useMemo(() => sortComplaints(state.items, sortMode), [sortMode, state.items]);

  async function handleActionChange(item, nextValue) {
    setActionById((current) => ({ ...current, [item.id]: nextValue }));
    setBusyId(item.id);

    try {
      await decideComplaintModeration(item.id, { status: nextValue });
      if (nextValue === "dismiss" || nextValue === "block") {
        const isDismiss = nextValue === "dismiss";
        const isAllowed = isDismiss ? includeDismissedRef.current : includeClosedRef.current;

        if (!isAllowed) {
          decidedIdsRef.current.add(item.id);
          setState((current) => ({
            ...current,
            items: current.items.filter((entry) => entry.id !== item.id),
          }));
        } else {
          const nextStatus = isDismiss ? "dismissed" : "upheld";
          setState((current) => ({
            ...current,
            items: current.items.map((entry) =>
              entry.id === item.id ? { ...entry, status: nextStatus } : entry
            ),
          }));
        }
      } else {
        setState((current) => ({
          ...current,
          items: current.items.map((entry) =>
            entry.id === item.id ? { ...entry, status: "in_review" } : entry
          ),
        }));
      }
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

        <div className="moderator-complaints-summary__controls" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <SegmentedControl
            items={SORT_OPTIONS}
            value={sortMode}
            onChange={setSortMode}
            stretch
            className="moderator-complaints-summary__segmented"
            ariaLabel="Сортировка очереди жалоб"
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "4px" }}>
            <Switch
              checked={showClosed}
              onChange={(event) => setShowClosed(event.target.checked)}
            >
              <span className="ui-check__label">Показывать заблокированные</span>
            </Switch>
            <Switch
              checked={showDismissed}
              onChange={(event) => setShowDismissed(event.target.checked)}
            >
              <span className="ui-check__label">Показывать снятые</span>
            </Switch>
          </div>
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
