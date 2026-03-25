import { useEffect, useMemo, useState } from "react";
import { getModerationCompanies, getModerationDashboard, getModerationOpportunities } from "../api/moderation";
import { ApiError } from "../lib/http";
import { Alert, Card, EmptyState, Loader, Tag } from "../shared/ui";
import { ModeratorMetricCard, ModeratorPageIntro } from "./shared";

function formatDate(value) {
  if (!value) {
    return "Дата не указана";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
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

export function ModeratorDashboardApp() {
  const [state, setState] = useState({
    status: "loading",
    dashboard: null,
    companies: [],
    opportunities: [],
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [dashboard, companies, opportunities] = await Promise.all([
          getModerationDashboard(controller.signal),
          getModerationCompanies(controller.signal),
          getModerationOpportunities(controller.signal),
        ]);

        setState({
          status: "ready",
          dashboard,
          companies: Array.isArray(companies) ? companies : [],
          opportunities: Array.isArray(opportunities) ? opportunities : [],
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          dashboard: null,
          companies: [],
          opportunities: [],
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const metrics = useMemo(() => {
    const dashboard = state.dashboard ?? {};

    return [
      {
        value: String(dashboard.opportunitiesPending ?? 0),
        title: "Возможности на проверке",
        note: "Количество карточек, ожидающих решения модератора.",
      },
      {
        value: String(dashboard.companiesPending ?? 0),
        title: "Компании на верификации",
        note: "Работодатели, чьи данные и документы еще не подтверждены.",
      },
      {
        value: String(dashboard.totalUsers ?? 0),
        title: "Пользователи платформы",
        note: "Общее количество активных профилей в системе.",
      },
    ];
  }, [state.dashboard]);

  const pendingCompanies = useMemo(
    () => state.companies.filter((item) => item.verificationStatus === "pending" || item.verificationStatus === "revision").slice(0, 5),
    [state.companies]
  );
  const pendingOpportunities = useMemo(
    () => state.opportunities.filter((item) => item.moderationStatus === "pending" || item.moderationStatus === "revision").slice(0, 5),
    [state.opportunities]
  );

  return (
    <>
      <ModeratorPageIntro
        title="Дашборд модерации"
        description="Экран строится на реальных агрегатах `/api/moderation/dashboard` и очередях компаний и возможностей, которые ожидают решения."
      />

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
        <>
          <section className="moderator-metrics">
            {metrics.map((item, index) => (
              <ModeratorMetricCard key={item.title} item={item} delayIndex={index + 1} />
            ))}
          </section>

          <section className="moderator-main-grid">
            <Card className="moderator-panel moderator-panel--activity moderator-fade-up moderator-fade-up--delay-2">
              <div className="moderator-panel__head">
                <Tag tone="accent">Компании</Tag>
                <div className="moderator-panel__copy">
                  <h2 className="ui-type-h1">Очередь верификации компаний</h2>
                  <p className="ui-type-body-lg">Первые компании, которые требуют проверки профиля и документов.</p>
                </div>
              </div>

              {pendingCompanies.length ? (
                <div className="moderator-activity-list">
                  {pendingCompanies.map((item) => (
                    <article key={item.id} className="moderator-activity-item">
                      <div className="moderator-activity-item__top">
                        <Tag>{translateCompanyStatus(item.verificationStatus)}</Tag>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                      <div className="moderator-activity-item__copy">
                        <h3 className="ui-type-h3">{item.companyName}</h3>
                        <p className="ui-type-body">{item.email}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="Компаний в очереди нет" description="Когда новые работодатели отправят данные на проверку, они появятся здесь." tone="neutral" compact />
              )}
            </Card>

            <Card className="moderator-panel moderator-panel--summary moderator-fade-up moderator-fade-up--delay-3">
              <div className="moderator-panel__head">
                <Tag tone="accent">Возможности</Tag>
                <div className="moderator-panel__copy">
                  <h2 className="ui-type-h1">Очередь публикаций</h2>
                  <p className="ui-type-body-lg">Последние карточки, которые ждут модерации или доработки.</p>
                </div>
              </div>

              {pendingOpportunities.length ? (
                <div className="moderator-summary-list">
                  {pendingOpportunities.map((item) => (
                    <article key={item.id} className="moderator-summary-item">
                      <div className="moderator-summary-item__copy">
                        <h3 className="ui-type-h3">{item.title}</h3>
                        <p className="ui-type-body">{item.companyName}</p>
                      </div>
                      <span className="ui-type-caption">{translateModerationStatus(item.moderationStatus)}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="Очередь возможностей пуста" description="Новые публикации появятся после действий компаний." tone="neutral" compact />
              )}
            </Card>
          </section>
        </>
      ) : null}
    </>
  );
}
