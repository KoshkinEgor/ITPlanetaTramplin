import { useEffect, useMemo, useState } from "react";
import { OpportunityBlockCard } from "../components/opportunities";
import { getCandidateContacts } from "../api/candidate";
import { getOpportunities } from "../api/opportunities";
import { useCandidateApplications } from "./candidate-applications-store";
import { ApiError } from "../lib/http";
import { Alert, Card, EmptyState, Loader, Tag } from "../shared/ui";
import { mapCandidateApplicationToCard, mapContactToCard } from "./mappers";
import { CandidateContactCard, CandidateSectionHeader } from "./shared";

function mapOpportunityCard(item) {
  return {
    type: item.opportunityType || "Возможность",
    status: item.moderationStatus === "approved" ? "Опубликовано" : item.moderationStatus,
    statusTone: item.moderationStatus === "approved" ? "success" : "warning",
    title: item.title,
    company: [item.companyName, item.locationCity].filter(Boolean).join(" · "),
    accent: item.employmentType || "",
    chips: Array.isArray(item.tags) ? item.tags.slice(0, 4) : [],
  };
}

export function CandidateOverviewApp() {
  const applicationsState = useCandidateApplications();
  const [state, setState] = useState({
    status: "loading",
    contacts: [],
    opportunities: [],
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [contacts, opportunities] = await Promise.all([
          getCandidateContacts(controller.signal),
          getOpportunities(controller.signal),
        ]);

        setState({
          status: "ready",
          contacts: Array.isArray(contacts) ? contacts : [],
          opportunities: Array.isArray(opportunities) ? opportunities : [],
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          contacts: [],
          opportunities: [],
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const topOpportunities = useMemo(() => state.opportunities.slice(0, 3).map(mapOpportunityCard), [state.opportunities]);
  const topContacts = useMemo(() => state.contacts.slice(0, 3).map(mapContactToCard), [state.contacts]);
  const recentApplications = useMemo(
    () => applicationsState.applications.slice(0, 3).map(mapCandidateApplicationToCard),
    [applicationsState.applications]
  );

  return (
    <>
      {state.status === "loading" ? <Loader label="Загружаем профиль кандидата" surface /> : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Доступ ограничен"
            title="Нужно войти как кандидат"
            description="Профиль доступен только после авторизации кандидата."
            tone="warning"
          />
        </Card>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить профиль" showIcon>
          {state.error?.message ?? "Попробуйте обновить страницу позже."}
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <>
          <section className="candidate-page-section">
            <CandidateSectionHeader title="Рекомендуемые возможности" />

            {topOpportunities.length ? (
              <div className="candidate-opportunity-rail" aria-label="Рекомендуемые возможности">
                {topOpportunities.map((item, index) => (
                  <OpportunityBlockCard
                    key={`${item.title}-${index}`}
                    item={item}
                    surface="panel"
                    size="md"
                    className="candidate-opportunity-rail__card"
                    detailAction={{ href: "/opportunities", label: "Открыть каталог", variant: "secondary" }}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState
                  eyebrow="Каталог пуст"
                  title="Пока нет одобренных возможностей"
                  description="После модерации новых публикаций карточки появятся здесь автоматически."
                  tone="neutral"
                />
              </Card>
            )}
          </section>

          <section className="candidate-page-section">
            <CandidateSectionHeader eyebrow="Активность" title="Последние отклики" />

            {applicationsState.status === "loading" && recentApplications.length === 0 ? (
              <Card>
                <Loader label="Загружаем отклики" surface />
              </Card>
            ) : null}

            {applicationsState.status === "error" && recentApplications.length === 0 ? (
              <Alert tone="error" title="Не удалось загрузить отклики" showIcon>
                {applicationsState.error?.message ?? "Попробуйте обновить данные позже."}
              </Alert>
            ) : null}

            {applicationsState.status !== "loading" || recentApplications.length ? (
              recentApplications.length ? (
                <div className="candidate-page-stack">
                  {recentApplications.map((item) => (
                    <Card key={item.id} className="candidate-page-panel">
                      <div className="candidate-page-panel__stack">
                        <div className="candidate-page-panel__row">
                          <h3 className="ui-type-h3">{item.title}</h3>
                          <Tag>{item.statusLabel}</Tag>
                        </div>
                        <p className="ui-type-body">{item.company}</p>
                        <p className="ui-type-body">{item.description}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <EmptyState
                    eyebrow="Пусто"
                    title="Откликов пока нет"
                    description="Когда кандидат откликнется на реальную возможность, статус появится в этом блоке."
                    tone="neutral"
                  />
                </Card>
              )
            ) : null}
          </section>

          <section className="candidate-page-section">
            <CandidateSectionHeader eyebrow="Контакты" title="Рекомендуемые контакты" />

            {topContacts.length ? (
              <div className="candidate-page-grid candidate-page-grid--three">
                {topContacts.map((contact) => (
                  <CandidateContactCard key={contact.id} contact={contact} variant="compact" />
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState
                  eyebrow="Нет контактов"
                  title="Связи пока не добавлены"
                  description="Контакты появятся после реальных взаимодействий кандидата с другими профилями."
                  tone="neutral"
                />
              </Card>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
