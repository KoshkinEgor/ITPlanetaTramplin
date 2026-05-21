import { useEffect, useMemo, useState } from "react";
import { getModerationAuditLog } from "../api/moderation";
import { ActivityLog, Alert, DashboardPageHeader, Loader } from "../shared/ui";

const LOG_FILTERS = [
  { value: "all", label: "Все" },
  { value: "opportunity", label: "Возможности" },
  { value: "company", label: "Компании" },
  { value: "candidate", label: "Кандидаты" },
  { value: "complaint", label: "Жалобы" },
  { value: "tag", label: "Теги" },
  { value: "system_reference", label: "Справочники" },
];

function formatLogTimestamp(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Дата не указана";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function normalizeItem(item) {
  const timestamp = item.timestamp ?? item.Timestamp ?? item.createdAt ?? item.CreatedAt;

  return {
    id: item.id ?? item.Id,
    kind: item.kind ?? item.Kind ?? item.entityType ?? item.EntityType ?? "Система",
    title: item.title ?? item.Title ?? item.action ?? item.Action ?? "Событие",
    description: item.description ?? item.Description ?? item.summary ?? item.Summary ?? "",
    timestampValue: timestamp,
    timestamp: formatLogTimestamp(timestamp),
  };
}

export function ModeratorLogsApp() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [state, setState] = useState({ status: "loading", items: [], error: null });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setState((current) => ({ ...current, status: "loading", error: null }));
        const payload = await getModerationAuditLog({ query, entityType: activeFilter }, controller.signal);
        if (!controller.signal.aborted) {
          setState({ status: "ready", items: (Array.isArray(payload) ? payload : []).map(normalizeItem), error: null });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({ status: "error", items: [], error });
        }
      }
    }

    load();
    return () => controller.abort();
  }, [activeFilter, query]);

  const filteredItems = useMemo(() => state.items, [state.items]);

  return (
    <>
      <DashboardPageHeader
        title="Логи платформы"
        description="Реальные события модерации, изменения справочников, тегов и системных настроек."
        className="moderator-fade-up"
      />

      {state.status === "loading" ? <Loader label="Загружаем логи" surface /> : null}
      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить логи" showIcon>{state.error?.message ?? "Попробуйте повторить позже."}</Alert>
      ) : null}

      <ActivityLog
        label="Журнал"
        title="Последние записи"
        description="События сохраняются после решений модерации и изменений системных разделов."
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Поиск по действию или описанию"
        filters={LOG_FILTERS}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        items={filteredItems}
        emptyStateTitle="Записей не найдено"
        emptyStateDescription="Измените фильтр или выполните действие модерации."
        className="moderator-fade-up moderator-fade-up--delay-1"
        data-testid="moderator-activity-log"
      />
    </>
  );
}
