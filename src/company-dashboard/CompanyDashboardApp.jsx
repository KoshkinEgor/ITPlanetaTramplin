import { useEffect, useMemo, useState } from "react";
import { PUBLIC_HEADER_NAV_ITEMS } from "../app/routes";
import { PortalHeader } from "../widgets/layout/PortalHeader/PortalHeader";
import { Alert, Badge, Button, Card, EmptyState, FormField, Input, Loader, ResponseCard, SectionHeader, Select, Textarea } from "../shared/ui";
import { createOpportunity, deleteOpportunity, updateOpportunity } from "../api/opportunities";
import {
  getCompanyOpportunities,
  getCompanyProfile,
  getOpportunityApplications,
  updateCompanyProfile,
  updateOpportunityApplicationStatus,
} from "../api/company";
import { ApiError } from "../lib/http";
import "./company-dashboard.css";

const navItems = PUBLIC_HEADER_NAV_ITEMS;

const OPPORTUNITY_TYPE_OPTIONS = [
  { value: "vacancy", label: "Вакансия" },
  { value: "internship", label: "Стажировка" },
  { value: "event", label: "Мероприятие" },
];

const APPLICATION_STATUS_OPTIONS = [
  { value: "submitted", label: "Отправлено" },
  { value: "reviewing", label: "На рассмотрении" },
  { value: "invited", label: "Приглашение" },
  { value: "accepted", label: "Принято" },
  { value: "rejected", label: "Отказ" },
  { value: "withdrawn", label: "Отозвано" },
];

function translateModerationStatus(status) {
  switch (status) {
    case "approved":
      return "Одобрено";
    case "revision":
      return "На доработке";
    case "rejected":
      return "Отклонено";
    default:
      return "На проверке";
  }
}

function translateVerificationStatus(status) {
  switch (status) {
    case "approved":
      return "Подтверждена";
    case "revision":
      return "Нужна доработка";
    case "rejected":
      return "Отклонена";
    default:
      return "На проверке";
  }
}

function translateOpportunityType(type) {
  switch (type) {
    case "vacancy":
      return "Вакансия";
    case "internship":
      return "Стажировка";
    case "event":
      return "Мероприятие";
    default:
      return type || "Возможность";
  }
}

function translateApplicationStatus(status) {
  return APPLICATION_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status ?? "Статус не указан";
}

function mapApplicationTone(status) {
  switch (status) {
    case "accepted":
      return "success";
    case "invited":
      return "warning";
    case "rejected":
      return "error";
    default:
      return "info";
  }
}

function parseTags(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createOpportunityDraft(item = null) {
  return {
    id: item?.id ?? null,
    title: item?.title ?? "",
    description: item?.description ?? "",
    locationCity: item?.locationCity ?? "",
    locationAddress: item?.locationAddress ?? "",
    opportunityType: item?.opportunityType ?? "vacancy",
    tags: Array.isArray(item?.tags) ? item.tags.join(", ") : "",
  };
}

function CompanyApplicationCard({ item, edit, onEditChange, onSave, busyId }) {
  const isSaving = busyId === item.id;

  return (
    <Card className="company-dashboard-response">
      <div className="candidate-page-stack">
        <div className="company-dashboard-list-item__top">
          <div>
            <h3 className="ui-type-h3">{item.candidateName || "Кандидат без имени"}</h3>
            <p className="ui-type-caption">{item.candidateEmail}</p>
          </div>
          <Badge tone={item.status === "accepted" ? "success" : item.status === "invited" ? "warning" : "neutral"}>
            {translateApplicationStatus(item.status)}
          </Badge>
        </div>

        <p className="ui-type-body">{item.candidateDescription || "Кандидат пока не заполнил описание профиля."}</p>
        <p className="ui-type-caption">Отклик на: {item.opportunityTitle}</p>
        <p className="ui-type-caption">
          Навыки: {Array.isArray(item.candidateSkills) && item.candidateSkills.length ? item.candidateSkills.join(", ") : "не указаны"}
        </p>

        <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
          <FormField label="Статус отклика">
            <Select
              value={edit.status}
              onValueChange={(value) => onEditChange(item.id, "status", value)}
              options={APPLICATION_STATUS_OPTIONS}
            />
          </FormField>

          <FormField label="Комментарий работодателя">
            <Textarea
              value={edit.employerNote}
              onValueChange={(value) => onEditChange(item.id, "employerNote", value)}
              rows={3}
              autoResize
            />
          </FormField>
        </div>

        <div className="company-dashboard-panel__actions">
          <Button type="button" onClick={() => onSave(item)} disabled={isSaving}>
            {isSaving ? "Сохраняем..." : "Обновить отклик"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function CompanyDashboardApp() {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({
    status: "loading",
    profile: null,
    opportunities: [],
    applications: [],
    error: null,
  });
  const [profileDraft, setProfileDraft] = useState({
    companyName: "",
    legalAddress: "",
    description: "",
    socials: "",
    verificationData: "",
  });
  const [profileSave, setProfileSave] = useState({ status: "idle", error: "" });
  const [opportunityDraft, setOpportunityDraft] = useState(createOpportunityDraft());
  const [opportunitySave, setOpportunitySave] = useState({ status: "idle", error: "" });
  const [applicationEdits, setApplicationEdits] = useState({});
  const [busyApplicationId, setBusyApplicationId] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const profile = await getCompanyProfile(controller.signal);
        const opportunities = await getCompanyOpportunities(controller.signal);
        const applicationLists = await Promise.all(
          (Array.isArray(opportunities) ? opportunities : []).map(async (item) => {
            const applications = await getOpportunityApplications(item.id, controller.signal);
            return (Array.isArray(applications) ? applications : []).map((application) => ({
              ...application,
              opportunityTitle: item.title,
            }));
          })
        );

        const flatApplications = applicationLists.flat();

        setState({
          status: "ready",
          profile,
          opportunities: Array.isArray(opportunities) ? opportunities : [],
          applications: flatApplications,
          error: null,
        });

        setProfileDraft({
          companyName: profile?.companyName ?? "",
          legalAddress: profile?.legalAddress ?? "",
          description: profile?.description ?? "",
          socials: profile?.socials ?? "",
          verificationData: profile?.verificationData ?? "",
        });
        setApplicationEdits(
          Object.fromEntries(
            flatApplications.map((item) => [
              item.id,
              {
                status: item.status ?? "submitted",
                employerNote: item.employerNote ?? "",
              },
            ])
          )
        );
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          profile: null,
          opportunities: [],
          applications: [],
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, [reloadKey]);

  const metrics = useMemo(() => {
    const activePublications = state.opportunities.filter((item) => !item.deletedAt).length;
    const moderationQueue = state.opportunities.filter((item) => item.moderationStatus !== "approved").length;

    return [
      { value: String(activePublications), label: "Публикации", note: "Все карточки компании из `/api/company/me/opportunities`." },
      { value: String(state.applications.length), label: "Отклики", note: "Все отклики по опубликованным карточкам." },
      { value: String(moderationQueue), label: "На проверке", note: "После редактирования карточка снова уходит в модерацию." },
    ];
  }, [state.applications.length, state.opportunities]);

  function handleProfileChange(field, value) {
    setProfileDraft((current) => ({ ...current, [field]: value }));
    setProfileSave((current) => (current.status === "success" ? { status: "idle", error: "" } : current));
  }

  async function handleProfileSave(event) {
    event.preventDefault();
    setProfileSave({ status: "saving", error: "" });

    try {
      const profile = await updateCompanyProfile({
        companyName: profileDraft.companyName.trim(),
        legalAddress: profileDraft.legalAddress.trim() || null,
        description: profileDraft.description.trim() || null,
        socials: profileDraft.socials.trim() || null,
        verificationData: profileDraft.verificationData.trim() || null,
      });

      setState((current) => ({ ...current, profile }));
      setProfileSave({ status: "success", error: "" });
    } catch (error) {
      setProfileSave({
        status: "error",
        error: error?.message ?? "Не удалось обновить профиль компании.",
      });
    }
  }

  function handleOpportunityField(field, value) {
    setOpportunityDraft((current) => ({ ...current, [field]: value }));
    setOpportunitySave((current) => (current.status === "success" ? { status: "idle", error: "" } : current));
  }

  function startEditingOpportunity(item) {
    setOpportunityDraft(createOpportunityDraft(item));
    setOpportunitySave({ status: "idle", error: "" });
  }

  function resetOpportunityForm() {
    setOpportunityDraft(createOpportunityDraft());
    setOpportunitySave({ status: "idle", error: "" });
  }

  async function handleOpportunitySubmit(event) {
    event.preventDefault();

    if (!opportunityDraft.title.trim()) {
      setOpportunitySave({ status: "error", error: "Укажите название возможности." });
      return;
    }

    if (!opportunityDraft.description.trim()) {
      setOpportunitySave({ status: "error", error: "Добавьте описание возможности." });
      return;
    }

    const tags = parseTags(opportunityDraft.tags);
    setOpportunitySave({ status: "saving", error: "" });

    try {
      if (opportunityDraft.id) {
        await updateOpportunity(opportunityDraft.id, {
          id: opportunityDraft.id,
          title: opportunityDraft.title.trim(),
          description: opportunityDraft.description.trim(),
          locationCity: opportunityDraft.locationCity.trim() || null,
          locationAddress: opportunityDraft.locationAddress.trim() || null,
          opportunityType: opportunityDraft.opportunityType,
          tags,
        });
      } else {
        await createOpportunity({
          title: opportunityDraft.title.trim(),
          description: opportunityDraft.description.trim(),
          locationCity: opportunityDraft.locationCity.trim() || null,
          locationAddress: opportunityDraft.locationAddress.trim() || null,
          opportunityType: opportunityDraft.opportunityType,
          tags,
        });
      }

      resetOpportunityForm();
      setOpportunitySave({ status: "success", error: "" });
      setReloadKey((current) => current + 1);
    } catch (error) {
      setOpportunitySave({
        status: "error",
        error: error?.message ?? "Не удалось сохранить публикацию.",
      });
    }
  }

  async function handleOpportunityDelete(opportunityId) {
    setOpportunitySave({ status: "saving", error: "" });

    try {
      await deleteOpportunity(opportunityId);
      if (opportunityDraft.id === opportunityId) {
        resetOpportunityForm();
      }
      setOpportunitySave({ status: "success", error: "" });
      setReloadKey((current) => current + 1);
    } catch (error) {
      setOpportunitySave({
        status: "error",
        error: error?.message ?? "Не удалось удалить публикацию.",
      });
    }
  }

  function handleApplicationEditChange(applicationId, field, value) {
    setApplicationEdits((current) => ({
      ...current,
      [applicationId]: {
        ...current[applicationId],
        [field]: value,
      },
    }));
  }

  async function handleApplicationSave(item) {
    const edit = applicationEdits[item.id];
    setBusyApplicationId(item.id);

    try {
      await updateOpportunityApplicationStatus(item.opportunityId, item.id, {
        status: edit.status,
        employerNote: edit.employerNote || null,
      });
      setBusyApplicationId(0);
      setReloadKey((current) => current + 1);
    } catch (error) {
      setBusyApplicationId(0);
      setOpportunitySave({
        status: "error",
        error: error?.message ?? "Не удалось обновить статус отклика.",
      });
    }
  }

  return (
    <div className="company-dashboard-page">
      <div className="company-dashboard-page__backdrop" aria-hidden="true" />

      <div className="company-dashboard-page__shell ui-page-shell">
        <PortalHeader
          navItems={navItems}
          currentKey={undefined}
          actionHref="/opportunities"
          actionLabel="Каталог"
        />

        <main className="company-dashboard-page__main">
          <section className="ui-card company-dashboard-hero">
            <div className="company-dashboard-hero__copy">
              <div className="company-dashboard-hero__badges">
                <Badge kind="tag" tone={state.profile?.verificationStatus === "approved" ? "success" : "neutral"}>
                  {translateVerificationStatus(state.profile?.verificationStatus)}
                </Badge>
                <Badge kind="chip" tone="accent" active>
                  Real Data
                </Badge>
              </div>

              <h1 className="ui-type-h2">{state.profile?.companyName || "Кабинет компании"}</h1>
              <p className="ui-type-body">
                Кабинет работает поверх реальных company и opportunity endpoints: профиль компании, публикации и отклики больше не берутся из статических массивов.
              </p>
            </div>

            <div className="company-dashboard-hero__actions">
              <Button href="/moderator/companies" variant="secondary">Статус модерации</Button>
              <Button href="/candidate/profile" variant="ghost">Кандидатский кабинет</Button>
            </div>
          </section>

          {state.status === "loading" ? <Loader label="Загружаем кабинет компании" surface /> : null}

          {state.status === "unauthorized" ? (
            <Card>
              <EmptyState
                eyebrow="Доступ ограничен"
                title="Нужно войти как компания"
                description="Компаниям доступны только свои профиль, публикации и отклики."
                tone="warning"
              />
            </Card>
          ) : null}

          {state.status === "error" ? (
            <Alert tone="error" title="Не удалось загрузить кабинет" showIcon>
              {state.error?.message ?? "Попробуйте обновить страницу позже."}
            </Alert>
          ) : null}

          {state.status === "ready" ? (
            <>
              <section className="company-dashboard-metrics" aria-label="Ключевые показатели">
                {metrics.map((item) => (
                  <Card key={item.label} tone="neutral" className="company-dashboard-metric">
                    <strong>{item.value}</strong>
                    <span className="ui-type-h3">{item.label}</span>
                    <p className="ui-type-body">{item.note}</p>
                  </Card>
                ))}
              </section>

              {profileSave.status === "error" || opportunitySave.status === "error" ? (
                <Alert tone="error" title="Операция не выполнена" showIcon>
                  {profileSave.error || opportunitySave.error}
                </Alert>
              ) : null}

              {profileSave.status === "success" || opportunitySave.status === "success" ? (
                <Alert tone="success" title="Изменения сохранены" showIcon>
                  Данные отправлены в backend. Для публикаций это означает новый цикл модерации.
                </Alert>
              ) : null}

              <section className="company-dashboard-layout">
                <Card className="company-dashboard-panel company-dashboard-panel--wide">
                  <SectionHeader
                    eyebrow="Профиль компании"
                    title="Данные компании"
                    description="Изменения уходят в `/api/company/me`."
                    size="md"
                  />

                  <form className="company-dashboard-stack" onSubmit={handleProfileSave} noValidate>
                    <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                      <FormField label="Название компании" required>
                        <Input value={profileDraft.companyName} onValueChange={(value) => handleProfileChange("companyName", value)} />
                      </FormField>
                      <FormField label="Юридический адрес">
                        <Input value={profileDraft.legalAddress} onValueChange={(value) => handleProfileChange("legalAddress", value)} />
                      </FormField>
                    </div>

                    <FormField label="Описание">
                      <Textarea value={profileDraft.description} onValueChange={(value) => handleProfileChange("description", value)} rows={5} autoResize />
                    </FormField>

                    <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                      <FormField label="Соцсети / ссылки">
                        <Textarea value={profileDraft.socials} onValueChange={(value) => handleProfileChange("socials", value)} rows={4} autoResize />
                      </FormField>
                      <FormField label="Данные для верификации">
                        <Textarea value={profileDraft.verificationData} onValueChange={(value) => handleProfileChange("verificationData", value)} rows={4} autoResize />
                      </FormField>
                    </div>

                    <div className="company-dashboard-panel__actions">
                      <Button type="submit" disabled={profileSave.status === "saving"}>
                        {profileSave.status === "saving" ? "Сохраняем..." : "Сохранить профиль"}
                      </Button>
                    </div>
                  </form>
                </Card>

                <Card className="company-dashboard-panel">
                  <SectionHeader
                    eyebrow="Публикации"
                    title={opportunityDraft.id ? "Редактирование публикации" : "Новая публикация"}
                    description="Форма работает через `/api/opportunities`."
                    size="md"
                  />

                  <form className="company-dashboard-stack" onSubmit={handleOpportunitySubmit} noValidate>
                    <FormField label="Название" required>
                      <Input value={opportunityDraft.title} onValueChange={(value) => handleOpportunityField("title", value)} />
                    </FormField>

                    <FormField label="Описание" required>
                      <Textarea value={opportunityDraft.description} onValueChange={(value) => handleOpportunityField("description", value)} rows={5} autoResize />
                    </FormField>

                    <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                      <FormField label="Тип">
                        <Select
                          value={opportunityDraft.opportunityType}
                          onValueChange={(value) => handleOpportunityField("opportunityType", value)}
                          options={OPPORTUNITY_TYPE_OPTIONS}
                        />
                      </FormField>
                      <FormField label="Город">
                        <Input value={opportunityDraft.locationCity} onValueChange={(value) => handleOpportunityField("locationCity", value)} />
                      </FormField>
                    </div>

                    <FormField label="Адрес">
                      <Input value={opportunityDraft.locationAddress} onValueChange={(value) => handleOpportunityField("locationAddress", value)} />
                    </FormField>

                    <FormField label="Теги через запятую">
                      <Input value={opportunityDraft.tags} onValueChange={(value) => handleOpportunityField("tags", value)} />
                    </FormField>

                    <div className="company-dashboard-panel__actions">
                      <Button type="submit" disabled={opportunitySave.status === "saving"}>
                        {opportunitySave.status === "saving"
                          ? "Сохраняем..."
                          : opportunityDraft.id
                            ? "Сохранить публикацию"
                            : "Создать публикацию"}
                      </Button>
                      {opportunityDraft.id ? (
                        <Button type="button" variant="secondary" onClick={resetOpportunityForm}>
                          Новая публикация
                        </Button>
                      ) : null}
                    </div>
                  </form>
                </Card>

                <Card className="company-dashboard-panel">
                  <SectionHeader
                    eyebrow="Список"
                    title="Публикации компании"
                    description="Карточки читаются из `/api/company/me/opportunities`."
                    size="md"
                  />

                  {state.opportunities.length ? (
                    <div className="company-dashboard-stack">
                      {state.opportunities.map((item) => (
                        <article key={item.id} className="company-dashboard-list-item">
                          <div className="company-dashboard-list-item__top">
                            <div>
                              <h3 className="ui-type-h3">{item.title}</h3>
                              <p className="ui-type-caption">
                                {translateOpportunityType(item.opportunityType)}
                                {item.locationCity ? ` · ${item.locationCity}` : ""}
                              </p>
                            </div>
                            <Badge tone={item.moderationStatus === "approved" ? "success" : item.moderationStatus === "revision" ? "warning" : "neutral"}>
                              {translateModerationStatus(item.moderationStatus)}
                            </Badge>
                          </div>
                          <p className="ui-type-body">{item.description || "Описание не заполнено."}</p>
                          <p className="ui-type-caption">Откликов: {item.applicationsCount}</p>
                          <div className="company-dashboard-panel__actions">
                            <Button type="button" variant="secondary" onClick={() => startEditingOpportunity(item)}>
                              Редактировать
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => handleOpportunityDelete(item.id)}>
                              Удалить
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Публикаций пока нет"
                      description="Создайте первую возможность через форму справа."
                      tone="neutral"
                      compact
                    />
                  )}
                </Card>
              </section>

              <Card className="company-dashboard-panel">
                <SectionHeader
                  eyebrow="Отклики"
                  title="Отклики кандидатов"
                  description="Работодатель может обновлять статус и комментарий отклика через `/api/opportunities/{id}/applications/{applicationId}`."
                  size="md"
                />

                {state.applications.length ? (
                  <div className="company-dashboard-stack">
                    {state.applications.map((item) => (
                      <CompanyApplicationCard
                        key={item.id}
                        item={item}
                        edit={applicationEdits[item.id] ?? { status: item.status, employerNote: item.employerNote ?? "" }}
                        onEditChange={handleApplicationEditChange}
                        onSave={handleApplicationSave}
                        busyId={busyApplicationId}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Откликов пока нет"
                    description="Когда кандидаты начнут откликаться на одобренные публикации, они появятся здесь."
                    tone="neutral"
                    compact
                  />
                )}
              </Card>

              <Card className="company-dashboard-panel">
                <SectionHeader
                  eyebrow="Сводка"
                  title="Последние отклики"
                  description="Компактный список для быстрого обзора потока кандидатов."
                  size="md"
                />

                {state.applications.length ? (
                  <div className="company-dashboard-stack">
                    {state.applications.slice(0, 3).map((item) => (
                      <ResponseCard
                        key={item.id}
                        name={item.candidateName || "Кандидат"}
                        subtitle={item.opportunityTitle}
                        status={translateApplicationStatus(item.status)}
                        statusTone={mapApplicationTone(item.status)}
                        tags={Array.isArray(item.candidateSkills) ? item.candidateSkills.slice(0, 3) : []}
                        description={item.candidateDescription || item.candidateEmail}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Нет новых откликов"
                    description="Сводка заполнится автоматически после первых реальных откликов."
                    tone="neutral"
                    compact
                  />
                )}
              </Card>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
