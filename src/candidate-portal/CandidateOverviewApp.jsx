import { useEffect, useMemo, useState } from "react";
import { AppLink } from "../app/AppLink";
import { buildOpportunityDetailRoute, routes } from "../app/routes";
import { OpportunityBlockCard, OpportunityBlockRail } from "../components/opportunities";
import { getCandidateContactSuggestions, getCandidateContacts } from "../api/candidate";
import { getOpportunities } from "../api/opportunities";
import { useCandidateApplications } from "./candidate-applications-store";
import { ApiError } from "../lib/http";
import { getOpportunityCardPresentation } from "../shared/lib/opportunityPresentation";
import { Alert, Button, Card, CareerPeerCard, DashboardActivityCard, EmptyState, Loader } from "../shared/ui";
import { mapContactToPeerCard } from "./mappers";
import { CandidateSectionHeader } from "./shared";
import { mapSocialUserToCard } from "./social";

function mapOpportunityCard(item) {
  const presentation = getOpportunityCardPresentation(item);

  return {
    id: item.id,
    ...presentation,
    status: item.moderationStatus === "approved" ? "Опубликовано" : item.moderationStatus,
    statusTone: item.moderationStatus === "approved" ? "success" : "warning",
    title: item.title,
    meta: [item.companyName, item.locationCity].filter(Boolean).join(" · "),
    chips: Array.isArray(item.tags) ? item.tags.slice(0, 4) : [],
  };
}

function formatActivityDate(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(parsed);
}

function getActivitySortValue(value) {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function buildApplicationActivityTitle(application) {
  const title = application?.opportunityTitle || "вакансию";

  switch (String(application?.status ?? "").trim().toLowerCase()) {
    case "submitted":
      return `Отклик отправлен: ${title}`;
    case "reviewing":
      return `Отклик рассматривается: ${title}`;
    case "invited":
      return `Получено приглашение: ${title}`;
    case "accepted":
      return `Подтверждено участие: ${title}`;
    case "rejected":
      return `Завершен отклик: ${title}`;
    case "withdrawn":
      return `Отклик снят: ${title}`;
    default:
      return `Обновлен отклик: ${title}`;
  }
}

function buildContactActivityDescription(contact) {
  const skills = Array.isArray(contact?.skills) ? contact.skills.filter(Boolean).slice(0, 3) : [];

  if (skills.length) {
    return `Навыки: ${skills.join(", ")}`;
  }

  return contact?.email || "Контакт сохранен в личной сети.";
}

function buildRecentActions(applications, contacts) {
  const applicationActions = (Array.isArray(applications) ? applications : []).slice(0, 2).map((application, index) => ({
    id: `application-${application?.id ?? index}`,
    sortValue: getActivitySortValue(application?.appliedAt),
    order: index,
    timestamp: formatActivityDate(application?.appliedAt),
    title: buildApplicationActivityTitle(application),
    description: [application?.companyName, application?.locationCity].filter(Boolean).join(" · ") || "Статус отклика обновлен.",
  }));
  const contactActions = (Array.isArray(contacts) ? contacts : []).slice(0, 2).map((contact, index) => {
    const name = contact?.name || contact?.email || "новый контакт";

    return {
      id: `contact-${contact?.contactProfileId ?? contact?.id ?? index}`,
      sortValue: getActivitySortValue(contact?.createdAt),
      order: applicationActions.length + index,
      timestamp: formatActivityDate(contact?.createdAt),
      title: `Добавлен контакт ${name}`,
      description: buildContactActivityDescription(contact),
    };
  });

  return [...applicationActions, ...contactActions]
    .sort((left, right) => right.sortValue - left.sortValue || left.order - right.order)
    .slice(0, 3);
}

function mapSuggestionToPeerCard(user) {
  const card = mapSocialUserToCard(user);

  return {
    id: card.id,
    userId: card.userId,
    initials: card.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "К",
    name: card.name,
    sharedSkills: card.skills.slice(0, 3),
    reasons: card.reasons,
    href: card.href,
  };
}

export function CandidateOverviewApp({ profile = null }) {
  const applicationsState = useCandidateApplications();
  const [state, setState] = useState({
    status: "loading",
    contacts: [],
    suggestions: [],
    opportunities: [],
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [contacts, suggestions, opportunities] = await Promise.all([
          getCandidateContacts(controller.signal),
          getCandidateContactSuggestions({ source: "overview", limit: 4 }, controller.signal),
          getOpportunities(controller.signal),
        ]);

        setState({
          status: "ready",
          contacts: Array.isArray(contacts) ? contacts : [],
          suggestions: Array.isArray(suggestions) ? suggestions : [],
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
          suggestions: [],
          opportunities: [],
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const candidateSkills = useMemo(
    () => (Array.isArray(profile?.skills) ? profile.skills.filter(Boolean) : []),
    [profile]
  );
  const topOpportunities = useMemo(() => state.opportunities.slice(0, 3).map(mapOpportunityCard), [state.opportunities]);
  const topContacts = useMemo(
    () => state.contacts
      .map((contact) => mapContactToPeerCard(contact, candidateSkills))
      .filter((contact) => contact.id)
      .slice(0, 2),
    [candidateSkills, state.contacts]
  );
  const topSuggestions = useMemo(
    () => state.suggestions.slice(0, 2).map(mapSuggestionToPeerCard),
    [state.suggestions]
  );
  const recentActions = useMemo(
    () => buildRecentActions(applicationsState.applications, state.contacts),
    [applicationsState.applications, state.contacts]
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
            <div className="candidate-overview-section-head">
              <CandidateSectionHeader title="Рекомендуемые возможности" />
              <Button href={routes.opportunities.catalog} variant="secondary">
                Перейти в каталог
              </Button>
            </div>

            {topOpportunities.length ? (
              <OpportunityBlockRail
                ariaLabel="Рекомендуемые возможности"
                items={topOpportunities}
                surface="panel"
                size="md"
                cardPropsBuilder={() => ({
                  detailAction: { href: "/opportunities", label: "Открыть каталог", variant: "secondary" },
                })}
                renderItem={(item, { className, cardProps }) => (
                  <OpportunityBlockCard
                    item={item}
                    surface="panel"
                    size="md"
                    className={className}
                    {...cardProps}
                    detailAction={{
                      href: buildOpportunityDetailRoute(item.id),
                      label: "Подробнее",
                      variant: "secondary",
                    }}
                  />
                )}
              />
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

          <section className="candidate-page-section candidate-overview-highlights">
            <Card className="candidate-overview-spotlight">
              <div className="candidate-overview-spotlight__head">
                <span className="ui-pill-button ui-pill-button--lg is-active candidate-overview-spotlight__pill">
                  Моя сеть
                </span>
                <AppLink href={routes.candidate.contacts} className="candidate-overview-spotlight__link">
                  Открыть contacts hub
                </AppLink>
              </div>

              {topContacts.length ? (
                <div className="candidate-overview-spotlight__stack">
                  {topContacts.map((contact) => (
                    <CareerPeerCard key={contact.id} {...contact} profileHref={contact.href} actionLabel="Открыть профиль" className="candidate-overview-contact-card" />
                  ))}
                </div>
              ) : (
                <EmptyState
                  eyebrow="Нет контактов"
                  title="Ваша сеть пока пустая"
                  description="Сохраняйте кандидатов в контакты, и быстрый доступ к ним появится здесь."
                  tone="neutral"
                  compact
                />
              )}

              <div className="candidate-overview-spotlight__subsection">
                <div className="candidate-overview-spotlight__head">
                  <span className="ui-pill-button candidate-overview-spotlight__subpill">Люди для вас</span>
                </div>

                {topSuggestions.length ? (
                  <div className="candidate-overview-spotlight__stack">
                    {topSuggestions.map((contact) => (
                      <CareerPeerCard key={`suggestion-${contact.id}`} {...contact} profileHref={contact.href} actionLabel="Открыть профиль" className="candidate-overview-contact-card" />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    eyebrow="Нет suggestions"
                    title="Новых рекомендаций пока нет"
                    description="Когда появятся релевантные люди по навыкам, городу и откликам, они появятся здесь."
                    tone="neutral"
                    compact
                  />
                )}
              </div>
            </Card>

            <Card className="candidate-overview-spotlight candidate-overview-spotlight--activity">
              <div className="candidate-overview-spotlight__head">
                <span className="ui-pill-button ui-pill-button--lg is-active candidate-overview-spotlight__pill">
                  Последние действия
                </span>
              </div>

              {applicationsState.status === "loading" && recentActions.length === 0 ? (
                <Loader label="Загружаем последние действия" surface />
              ) : null}

              {applicationsState.status === "error" && recentActions.length === 0 ? (
                <Alert tone="error" title="Не удалось загрузить действия" showIcon>
                  {applicationsState.error?.message ?? "Попробуйте обновить данные позже."}
                </Alert>
              ) : null}

              {applicationsState.status !== "loading" || recentActions.length ? (
                recentActions.length ? (
                  <div className="candidate-overview-spotlight__stack">
                    {recentActions.map((item) => (
                      <DashboardActivityCard key={item.id} item={item} className="candidate-overview-activity-card" />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    eyebrow="Пусто"
                    title="Последних действий пока нет"
                    description="Отправьте отклик или добавьте новый контакт, чтобы лента начала обновляться."
                    tone="neutral"
                    compact
                  />
                )
              ) : null}
            </Card>
          </section>
        </>
      ) : null}
    </>
  );
}
