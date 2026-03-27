import { useEffect, useState } from "react";
import { getCompanyOpportunities } from "../api/company";
import { createOpportunity, deleteOpportunity, updateOpportunity } from "../api/opportunities";
import { ApiError } from "../lib/http";
import { Alert, Badge, Button, EmptyState, FormField, Input, Loader, Select, Textarea } from "../shared/ui";
import { CabinetContentSection } from "../widgets/layout";
import { createOpportunityDraft, parseTags, translateModerationStatus, translateOpportunityType } from "./utils";
import "./company-dashboard.css";

const OPPORTUNITY_TYPE_OPTIONS = [
  { value: "vacancy", label: "Вакансия" },
  { value: "internship", label: "Стажировка" },
  { value: "event", label: "Мероприятие" },
];

export function CompanyOpportunitiesSection() {
  const [state, setState] = useState({ status: "loading", opportunities: [], error: null });
  const [draft, setDraft] = useState(createOpportunityDraft());
  const [saveState, setSaveState] = useState({ status: "idle", error: "" });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const opportunities = await getCompanyOpportunities(controller.signal);
        setState({ status: "ready", opportunities: Array.isArray(opportunities) ? opportunities : [], error: null });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          opportunities: [],
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, [saveState.status]);

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaveState((current) => (current.status === "success" ? { status: "idle", error: "" } : current));
  }

  function startEditing(item) {
    setDraft(createOpportunityDraft(item));
    setSaveState({ status: "idle", error: "" });
  }

  function resetForm() {
    setDraft(createOpportunityDraft());
    setSaveState({ status: "idle", error: "" });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!draft.title.trim()) {
      setSaveState({ status: "error", error: "Укажите название публикации." });
      return;
    }

    if (!draft.description.trim()) {
      setSaveState({ status: "error", error: "Добавьте описание публикации." });
      return;
    }

    setSaveState({ status: "saving", error: "" });

    try {
      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        locationCity: draft.locationCity.trim() || null,
        locationAddress: draft.locationAddress.trim() || null,
        opportunityType: draft.opportunityType,
        tags: parseTags(draft.tags),
      };

      if (draft.id) {
        await updateOpportunity(draft.id, payload);
      } else {
        await createOpportunity(payload);
      }

      resetForm();
      setSaveState({ status: "success", error: "" });
    } catch (error) {
      setSaveState({
        status: "error",
        error: error?.message ?? "Не удалось сохранить публикацию.",
      });
    }
  }

  async function handleDelete(opportunityId) {
    setSaveState({ status: "saving", error: "" });

    try {
      await deleteOpportunity(opportunityId);
      setState((current) => ({
        ...current,
        opportunities: current.opportunities.filter((item) => item.id !== opportunityId),
      }));
      if (draft.id === opportunityId) {
        resetForm();
      }
      setSaveState({ status: "success", error: "" });
    } catch (error) {
      setSaveState({
        status: "error",
        error: error?.message ?? "Не удалось удалить публикацию.",
      });
    }
  }

  return (
    <>
      {state.status === "loading" ? <Loader label="Загружаем публикации компании" surface /> : null}

      {state.status === "unauthorized" ? (
        <CabinetContentSection eyebrow="Доступ ограничен" title="Нужно войти как компания" description="Публикации доступны только работодателю.">
          <EmptyState
            title="Нет доступа к публикациям"
            description="После авторизации здесь появится список карточек компании."
            tone="warning"
          />
        </CabinetContentSection>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить публикации" showIcon>
          {state.error?.message ?? "Попробуйте обновить страницу позже."}
        </Alert>
      ) : null}

      {saveState.status === "error" ? (
        <Alert tone="error" title="Операция не выполнена" showIcon>
          {saveState.error}
        </Alert>
      ) : null}

      {saveState.status === "success" ? (
        <Alert tone="success" title="Изменения сохранены" showIcon>
          Публикация обновлена. Если потребуется, она будет повторно проверена перед показом кандидатам.
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <div className="company-dashboard-stack">
          <CabinetContentSection
            eyebrow="Публикации"
            title={draft.id ? "Редактирование публикации" : "Новая публикация"}
            description="Заполните карточку публикации, чтобы рассказать кандидатам о вакансии, стажировке или мероприятии."
          >
            <form className="company-dashboard-stack" onSubmit={handleSubmit} noValidate>
              <FormField label="Название" required>
                <Input value={draft.title} onValueChange={(value) => updateField("title", value)} />
              </FormField>

              <FormField label="Описание" required>
                <Textarea value={draft.description} onValueChange={(value) => updateField("description", value)} rows={5} autoResize />
              </FormField>

              <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                <FormField label="Тип">
                  <Select value={draft.opportunityType} onValueChange={(value) => updateField("opportunityType", value)} options={OPPORTUNITY_TYPE_OPTIONS} />
                </FormField>
                <FormField label="Город">
                  <Input value={draft.locationCity} onValueChange={(value) => updateField("locationCity", value)} />
                </FormField>
              </div>

              <FormField label="Адрес">
                <Input value={draft.locationAddress} onValueChange={(value) => updateField("locationAddress", value)} />
              </FormField>

              <FormField label="Теги через запятую">
                <Input value={draft.tags} onValueChange={(value) => updateField("tags", value)} />
              </FormField>

              <div className="company-dashboard-panel__actions">
                <Button type="submit" disabled={saveState.status === "saving"}>
                  {saveState.status === "saving"
                    ? "Сохраняем..."
                    : draft.id
                      ? "Сохранить публикацию"
                      : "Создать публикацию"}
                </Button>
                {draft.id ? (
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Новая публикация
                  </Button>
                ) : null}
              </div>
            </form>
          </CabinetContentSection>

          <CabinetContentSection
            eyebrow="Список"
            title="Публикации компании"
            description="Здесь отображаются все активные публикации компании. Вы можете редактировать их или удалить ненужные."
          >
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
                    <p className="ui-type-body">{item.description || "Описание пока не заполнено."}</p>
                    <p className="ui-type-caption">Откликов: {item.applicationsCount}</p>
                    <div className="company-dashboard-panel__actions">
                      <Button type="button" variant="secondary" onClick={() => startEditing(item)}>
                        Редактировать
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => handleDelete(item.id)} disabled={saveState.status === "saving"}>
                        Удалить
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Публикаций пока нет"
                description="Создайте первую публикацию через форму выше, чтобы кандидаты увидели ваши предложения."
                tone="neutral"
                compact
              />
            )}
          </CabinetContentSection>
        </div>
      ) : null}
    </>
  );
}
