import { useMemo, useState } from "react";
import { ActivityLog, DashboardPageHeader } from "../shared/ui";

const LOG_FILTERS = [
  { value: "all", label: "Все" },
  { value: "pending", label: "На проверке" },
  { value: "approved", label: "Подтверждены" },
  { value: "revision", label: "Доработка" },
  { value: "rejected", label: "Отклонено" },
];

const LOG_ITEMS = [
  {
    id: "signal-hub-opportunity-created",
    kind: "Возможность",
    title: "Создана вакансия Signal Hub",
    description: "Компания отправила на проверку стажировку в продуктовой аналитике.",
    status: "pending",
    timestamp: "2026-03-19T11:20:00",
  },
  {
    id: "cloud-orbit-company-updated",
    kind: "Компания",
    title: "Профиль компании обновлён",
    description: "Cloud Orbit HR изменил описание команды и контактное лицо.",
    status: "approved",
    timestamp: "2026-03-19T10:45:00",
  },
  {
    id: "candidate-user-blocked",
    kind: "Пользователь",
    title: "Заблокирован пользователь",
    description: "Аккаунт Ильи Смирнова ограничен по повторным жалобам на спам.",
    status: "rejected",
    timestamp: "2026-03-19T10:15:00",
  },
  {
    id: "mlops-track-revision",
    kind: "Модерация",
    title: "Карточка отправлена на доработку",
    description: "MLOps Practice Track возвращён работодателю с комментарием по формату участия.",
    status: "revision",
    timestamp: "2026-03-18T17:40:00",
  },
  {
    id: "system-note-approved",
    kind: "Система",
    title: "Подтверждено изменение витрины",
    description: "Публичная подборка компаний пересчитана после вечерней синхронизации.",
    status: "approved",
    timestamp: "2026-03-18T09:05:00",
  },
];

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function parseDateValue(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatLogTimestamp(value) {
  const parsed = parseDateValue(value);

  if (!parsed) {
    return "Дата не указана";
  }

  const dateLabel = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(parsed);

  const timeLabel = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);

  return `${dateLabel} · ${timeLabel}`;
}

export function ModeratorLogsApp() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalize(query);

    return LOG_ITEMS.filter((item) => {
      const matchesFilter = activeFilter === "all" ? true : item.status === activeFilter;
      const haystack = normalize([item.kind, item.title, item.description, formatLogTimestamp(item.timestamp)].join(" "));

      return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
    }).map((item) => ({
      ...item,
      timestampValue: item.timestamp,
      timestamp: formatLogTimestamp(item.timestamp),
    }));
  }, [activeFilter, query]);

  return (
    <>
      <DashboardPageHeader
        title="Логи платформы"
        description="Последние события модерации, системные уведомления и действия кураторов по разделам."
        className="moderator-fade-up"
      />

      <ActivityLog
        label="Журнал"
        title="Последние записи"
        description="Быстрые действия работают прямо в строке, детальная проверка открывается справа."
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Поиск по названию, действию или дате"
        filters={LOG_FILTERS}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        items={filteredItems}
        emptyStateTitle="Совпадений не найдено"
        emptyStateDescription="Попробуйте изменить фильтр или ввести другой поисковый запрос."
        className="moderator-fade-up moderator-fade-up--delay-1"
        data-testid="moderator-activity-log"
      />
    </>
  );
}
