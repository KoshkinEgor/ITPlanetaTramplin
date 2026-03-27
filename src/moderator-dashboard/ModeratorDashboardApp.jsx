import { useEffect, useMemo, useState } from "react";
import { routes } from "../app/routes";
import { getModerationCompanies, getModerationOpportunities, getModerationUsers } from "../api/moderation";
import { ApiError } from "../lib/http";
import {
  Alert,
  Card,
  DashboardActivityCard,
  DashboardFocusCard,
  DashboardQueueCard,
  DashboardSectionHeader,
  EmptyState,
  Loader,
} from "../shared/ui";
import { ModeratorFilterPill, ModeratorSortControl } from "./shared";

const ACTIVITY_FILTERS = [
  { value: "all", label: "Все" },
  { value: "complaints", label: "Жалобы" },
  { value: "opportunities", label: "Возможности" },
  { value: "users", label: "Пользователи" },
  { value: "companies", label: "Компании" },
];

const QUEUE_FILTERS = [
  { value: "all", label: "Все" },
  { value: "complaints", label: "Жалобы" },
  { value: "opportunities", label: "Возможности" },
  { value: "verification", label: "Верификация" },
];

function parseDateValue(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const normalizedValue = String(value).trim();
  if (!normalizedValue) {
    return null;
  }

  const dateOnlyMatch = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
  }

  const parsed = new Date(normalizedValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateLabel(value) {
  const parsed = parseDateValue(value);

  if (!parsed) {
    return "Дата не указана";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function formatActivityTimestamp(value) {
  const parsed = parseDateValue(value);

  if (!parsed) {
    return "Дата не указана";
  }

  const dateLabel = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(parsed);

  const hasTime = typeof value === "string" && (value.includes("T") || /\d{2}:\d{2}/.test(value));

  if (!hasTime) {
    return dateLabel;
  }

  const timeLabel = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);

  return `${dateLabel} · ${timeLabel}`;
}

function getTimestamp(value) {
  return parseDateValue(value)?.getTime() ?? 0;
}

function isPendingOpportunity(item) {
  return item?.deletedAt == null && (item?.moderationStatus === "pending" || item?.moderationStatus === "revision");
}

function isPendingCompany(item) {
  return item?.verificationStatus === "pending" || item?.verificationStatus === "revision";
}

function isAttentionUser(item) {
  return !item?.isVerified || !item?.preVerify;
}

function translateModerationStatus(status) {
  switch (status) {
    case "approved":
      return "Одобрено";
    case "revision":
      return "Доработка";
    case "rejected":
      return "Отклонено";
    default:
      return "На проверке";
  }
}

function translateCompanyStatus(status) {
  switch (status) {
    case "approved":
      return "Подтверждена";
    case "revision":
      return "Доработка";
    case "rejected":
      return "Отклонена";
    default:
      return "На проверке";
  }
}

function translateOpportunityType(value) {
  switch (value) {
    case "vacancy":
      return "Вакансия";
    case "internship":
      return "Стажировка";
    case "event":
      return "Событие";
    default:
      return "Возможность";
  }
}

function translateUserRole(role) {
  switch (role) {
    case "candidate":
      return "соискатель";
    case "company":
      return "работодатель";
    case "moderator":
      return "куратор";
    default:
      return "пользователь";
  }
}

function getActivityEmptyState(filter) {
  switch (filter) {
    case "complaints":
      return {
        title: "Жалобы пока не подключены",
        description: "Структура блока готова. После появления moderation API жалобы появятся в этой ленте.",
      };
    case "users":
      return {
        title: "Нет новых пользователей",
        description: "Когда появятся профили, требующие внимания, они отобразятся здесь.",
      };
    case "companies":
      return {
        title: "Нет новых компаний",
        description: "Очередь компаний появится после новых заявок на верификацию.",
      };
    default:
      return {
        title: "Лента действий пока пуста",
        description: "Новые изменения появятся здесь, когда компании, пользователи или публикации потребуют проверки.",
      };
  }
}

function getQueueEmptyState(filter) {
  switch (filter) {
    case "complaints":
      return {
        title: "Очередь жалоб пуста",
        description: "После подключения раздела жалоб карточки появятся в этом приоритетном списке.",
      };
    case "verification":
      return {
        title: "Нет компаний на верификации",
        description: "Когда компании отправят данные на проверку, они появятся здесь.",
      };
    case "opportunities":
      return {
        title: "Нет возможностей в очереди",
        description: "Новые вакансии, стажировки и события появятся после отправки на модерацию.",
      };
    default:
      return {
        title: "Очередь задач сейчас пустая",
        description: "Когда появятся новые кейсы на проверку, они соберутся в этом блоке.",
      };
  }
}

function buildOpportunityActivity(item) {
  const typeLabel = translateOpportunityType(item.opportunityType).toLowerCase();

  return {
    id: `activity-opportunity-${item.id}`,
    kind: "opportunities",
    badge: "Возможность",
    timestamp: formatActivityTimestamp(item.publishAt),
    sortValue: getTimestamp(item.publishAt),
    title: `${translateOpportunityType(item.opportunityType)} отправлена на проверку`,
    description: `${item.companyName} добавила ${typeLabel} «${item.title}».`,
  };
}

function buildCompanyActivity(item) {
  return {
    id: `activity-company-${item.id}`,
    kind: "companies",
    badge: "Компания",
    timestamp: formatActivityTimestamp(item.createdAt),
    sortValue: getTimestamp(item.createdAt),
    title: item.verificationStatus === "revision" ? "Профиль компании обновлён" : "Компания ожидает верификацию",
    description: `${item.companyName} прислала данные для проверки. Статус: ${translateCompanyStatus(item.verificationStatus).toLowerCase()}.`,
  };
}

function buildUserActivity(item) {
  return {
    id: `activity-user-${item.id}`,
    kind: "users",
    badge: "Пользователь",
    timestamp: formatActivityTimestamp(item.createdAt),
    sortValue: getTimestamp(item.createdAt),
    title: item.isVerified ? "Пользователь обновил профиль" : "Новый пользователь требует внимания",
    description: `${item.email} зарегистрирован как ${translateUserRole(item.role)} и ещё не завершил подтверждение.`,
  };
}

function buildOpportunityQueueItem(item) {
  return {
    id: `queue-opportunity-${item.id}`,
    kind: "opportunities",
    badge: translateOpportunityType(item.opportunityType),
    title: item.title,
    description: `${item.companyName}${item.locationCity ? ` · ${item.locationCity}` : ""} · ${translateModerationStatus(item.moderationStatus)}`,
    dateLabel: formatDateLabel(item.publishAt),
    sortValue: getTimestamp(item.publishAt),
    actionHref: routes.moderator.opportunities,
    actionLabel: "Подробнее",
    actionVariant: "primary",
  };
}

function buildVerificationQueueItem(item) {
  return {
    id: `queue-company-${item.id}`,
    kind: "verification",
    badge: "Верификация",
    title: item.companyName,
    description:
      item.legalAddress || item.email
        ? `${item.legalAddress || item.email} · ${translateCompanyStatus(item.verificationStatus)}`
        : "Требуется верификация компании",
    dateLabel: formatDateLabel(item.createdAt),
    sortValue: getTimestamp(item.createdAt),
    actionHref: routes.moderator.companies,
    actionLabel: "Подробнее",
    actionVariant: "primary",
  };
}

export function ModeratorDashboardApp() {
  const [state, setState] = useState({
    status: "loading",
    companies: [],
    opportunities: [],
    users: [],
    error: null,
  });
  const [activityFilter, setActivityFilter] = useState("all");
  const [queueFilter, setQueueFilter] = useState("all");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [companies, opportunities, users] = await Promise.all([
          getModerationCompanies(controller.signal),
          getModerationOpportunities(controller.signal),
          getModerationUsers(controller.signal),
        ]);

        setState({
          status: "ready",
          companies: Array.isArray(companies) ? companies : [],
          opportunities: Array.isArray(opportunities) ? opportunities : [],
          users: Array.isArray(users) ? users : [],
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          companies: [],
          opportunities: [],
          users: [],
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const pendingCompanies = useMemo(() => state.companies.filter(isPendingCompany), [state.companies]);
  const pendingOpportunities = useMemo(() => state.opportunities.filter(isPendingOpportunity), [state.opportunities]);
  const attentionUsers = useMemo(() => state.users.filter(isAttentionUser), [state.users]);

  const activityItems = useMemo(
    () =>
      [...pendingOpportunities.map(buildOpportunityActivity), ...pendingCompanies.map(buildCompanyActivity), ...attentionUsers.map(buildUserActivity)]
        .sort((left, right) => right.sortValue - left.sortValue)
        .slice(0, 6),
    [attentionUsers, pendingCompanies, pendingOpportunities]
  );

  const filteredActivityItems = useMemo(
    () => activityItems.filter((item) => activityFilter === "all" || item.kind === activityFilter),
    [activityFilter, activityItems]
  );

  const queueItems = useMemo(
    () =>
      [...pendingOpportunities.map(buildOpportunityQueueItem), ...pendingCompanies.map(buildVerificationQueueItem)]
        .sort((left, right) => right.sortValue - left.sortValue)
        .slice(0, 8),
    [pendingCompanies, pendingOpportunities]
  );

  const filteredQueueItems = useMemo(
    () => queueItems.filter((item) => queueFilter === "all" || item.kind === queueFilter),
    [queueFilter, queueItems]
  );

  const focusItems = useMemo(
    () => [
      {
        id: "opportunities",
        title: "Возможности на проверке",
        description: "В очереди вакансии, стажировки и события, которые ждут решения модератора.",
        countLabel: `${pendingOpportunities.length} в работе`,
      },
      {
        id: "companies",
        title: "Компании на верификации",
        description: "Проверяем сайт, описание, домен и юридические данные работодателей.",
        countLabel: `${pendingCompanies.length} в работе`,
      },
      {
        id: "users",
        title: "Пользователи без подтверждения",
        description: "Отслеживаем новые регистрации и профили, которым ещё требуется подтверждение email.",
        countLabel: `${attentionUsers.length} в работе`,
      },
    ],
    [attentionUsers.length, pendingCompanies.length, pendingOpportunities.length]
  );

  const activityEmptyState = getActivityEmptyState(activityFilter);
  const queueEmptyState = getQueueEmptyState(queueFilter);

  return (
    <>
      {state.status === "loading" ? <Loader label="Загружаем дашборд модератора" surface /> : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить дашборд" showIcon>
          {state.error?.message ?? "Попробуйте повторить позже."}
        </Alert>
      ) : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Доступ ограничен"
            title="Нужна роль модератора"
            description="Дашборд модерации доступен только авторизованному модератору."
            tone="warning"
          />
        </Card>
      ) : null}

      {state.status === "ready" ? (
        <div className="moderator-dashboard-stack">
          <section className="moderator-dashboard-overview">
            <aside className="moderator-focus-rail moderator-fade-up moderator-fade-up--delay-2">
              <DashboardSectionHeader
                title="Дашборд модерации"
                description="Здесь собраны ключевые задачи модератора, которые остаются в работе и требуют внимания."
              />

              <div className="moderator-focus-rail__list">
                {focusItems.map((item) => (
                  <DashboardFocusCard key={item.id} item={item} />
                ))}
              </div>
            </aside>

            <Card className="moderator-panel moderator-panel--activity-feed moderator-fade-up moderator-fade-up--delay-3">
              <DashboardSectionHeader
                eyebrow="Активность"
                title="Последние действия"
                description="Здесь представлены последние изменения, которые нуждаются в проверке."
              />

              <div className="moderator-panel__filters moderator-panel__filters--dashboard">
                {ACTIVITY_FILTERS.map((filter) => (
                  <ModeratorFilterPill
                    key={filter.value}
                    label={filter.label}
                    active={filter.value === activityFilter}
                    onClick={() => setActivityFilter(filter.value)}
                  />
                ))}
              </div>

              <ModeratorSortControl />

              {filteredActivityItems.length ? (
                <div className="moderator-activity-list">
                  {filteredActivityItems.slice(0, 3).map((item) => (
                    <DashboardActivityCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <EmptyState title={activityEmptyState.title} description={activityEmptyState.description} tone="neutral" compact />
              )}
            </Card>
          </section>

          <Card className="moderator-panel moderator-panel--queue-stack moderator-fade-up moderator-fade-up--delay-3">
            <DashboardSectionHeader
              eyebrow="Приоритет"
              title="Очередь задач"
              description="Проверьте заявки, отправленные на модерацию."
              counter={filteredQueueItems.length}
            />

            <div className="moderator-panel__queue-toolbar">
              <div className="moderator-panel__filters moderator-panel__filters--dashboard">
                {QUEUE_FILTERS.map((filter) => (
                  <ModeratorFilterPill
                    key={filter.value}
                    label={filter.label}
                    active={filter.value === queueFilter}
                    onClick={() => setQueueFilter(filter.value)}
                  />
                ))}
              </div>

              <ModeratorSortControl />
            </div>

            {filteredQueueItems.length ? (
              <div className="moderator-queue-list">
                {filteredQueueItems.slice(0, 3).map((item) => (
                  <DashboardQueueCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState title={queueEmptyState.title} description={queueEmptyState.description} tone="neutral" compact />
            )}
          </Card>
        </div>
      ) : null}
    </>
  );
}
