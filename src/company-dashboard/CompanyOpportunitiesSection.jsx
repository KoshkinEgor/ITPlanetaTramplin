import { useEffect, useRef, useState } from "react";
import { buildOpportunityDetailRoute } from "../app/routes";
import { getCompanyOpportunities } from "../api/company";
import { createOpportunity, deleteOpportunity, getOpportunity, updateOpportunity } from "../api/opportunities";
import { ApiError } from "../lib/http";
import { OPPORTUNITY_TYPE_OPTIONS } from "../shared/lib/opportunityTypes";
import {
  buildOpportunityPayload,
  buildOpportunityPreviewRoute,
  createOpportunityDraft,
  getModerationStatusTone,
  getOpportunityCardPresentation,
  translateModerationStatus,
  validateOpportunityDraftForSubmit,
} from "../shared/lib/opportunityPresentation";
import { Alert, Badge, Button, Checkbox, EmptyState, FormField, Input, Loader, Select, Textarea } from "../shared/ui";
import { CabinetContentSection } from "../widgets/layout";
import { createOpportunityContactDraft, createOpportunityMediaDraft } from "./utils";
import { OpportunityLocationPicker } from "./OpportunityLocationPicker";
import "./company-dashboard.css";

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "office", label: "Офис" },
  { value: "hybrid", label: "Гибрид" },
  { value: "remote", label: "Удаленно" },
  { value: "online", label: "Онлайн" },
];

function formatDeadlineLabel(value) {
  if (!value) {
    return "Срок не указан";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Срок не указан";
  }

  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
}

function getContactPlaceholder(value) {
  const normalized = String(value ?? "").trim();

  if (normalized.includes("@") && !normalized.includes(" ")) {
    return "team@company.ru";
  }

  if (/^[+\d][\d\s().-]{5,}$/.test(normalized)) {
    return "+7 (999) 123-45-67";
  }

  return "https://t.me/company или team@company.ru";
}

function detectContactType(value) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return "link";
  }

  if (normalized.includes("@") && !normalized.includes(" ")) {
    return "email";
  }

  if (/^[+\d][\d\s().-]{5,}$/.test(normalized)) {
    return "phone";
  }

  return "link";
}

function renderTypedFields({ draft, onFieldChange, isEditingExisting }) {
  switch (draft.opportunityType) {
    case "vacancy":
      return (
        <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
          <FormField label="Зарплата от" required>
            <Input type="number" value={draft.salaryFrom} onValueChange={(value) => onFieldChange("salaryFrom", value)} />
          </FormField>
          <FormField label="Зарплата до" required>
            <Input type="number" value={draft.salaryTo} onValueChange={(value) => onFieldChange("salaryTo", value)} />
          </FormField>
        </div>
      );
    case "internship":
      return (
        <div className="company-dashboard-stack">
          <Checkbox
            label="Стажировка оплачиваемая"
            checked={Boolean(draft.isPaid)}
            onChange={(event) => onFieldChange("isPaid", event.target.checked)}
          />

          {draft.isPaid !== false ? (
            <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
              <FormField label="Стипендия от" required>
                <Input type="number" value={draft.stipendFrom} onValueChange={(value) => onFieldChange("stipendFrom", value)} />
              </FormField>
              <FormField label="Стипендия до" required>
                <Input type="number" value={draft.stipendTo} onValueChange={(value) => onFieldChange("stipendTo", value)} />
              </FormField>
            </div>
          ) : null}

          <FormField label="Длительность" required>
            <Input value={draft.duration} onValueChange={(value) => onFieldChange("duration", value)} placeholder="3 месяца" />
          </FormField>
        </div>
      );
    case "event":
      return (
        <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
          <FormField label="Дата и время начала" required>
            <Input type="datetime-local" value={draft.eventStartAt} onValueChange={(value) => onFieldChange("eventStartAt", value)} />
          </FormField>
          <FormField label="Дедлайн регистрации" required>
            <Input type="datetime-local" value={draft.registrationDeadline} onValueChange={(value) => onFieldChange("registrationDeadline", value)} />
          </FormField>
        </div>
      );
    case "mentoring":
      return (
        <div className="company-dashboard-stack">
          <FormField label="Длительность" required>
            <Input value={draft.duration} onValueChange={(value) => onFieldChange("duration", value)} placeholder="6 недель" />
          </FormField>
          <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
            <FormField label="Частота встреч" required>
              <Input value={draft.meetingFrequency} onValueChange={(value) => onFieldChange("meetingFrequency", value)} placeholder="1 раз в неделю" />
            </FormField>
            <FormField label="Количество мест" required>
              <Input type="number" value={draft.seatsCount} onValueChange={(value) => onFieldChange("seatsCount", value)} />
            </FormField>
          </div>
        </div>
      );
    default:
      return null;
  }
}

export function CompanyOpportunitiesSection() {
  const [state, setState] = useState({ status: "loading", opportunities: [], error: null });
  const [draft, setDraft] = useState(createOpportunityDraft());
  const [editorMode, setEditorMode] = useState(null);
  const [saveState, setSaveState] = useState({ status: "idle", error: "", message: "" });
  const [reloadKey, setReloadKey] = useState(0);
  const editorRef = useRef(null);

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
  }, [reloadKey]);

  function scrollEditorIntoView() {
    setTimeout(() => {
      editorRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function resetSuccessState() {
    setSaveState((current) => (current.status === "success" ? { status: "idle", error: "", message: "" } : current));
  }

  function openCreateForm() {
    setDraft(createOpportunityDraft());
    setEditorMode("create");
    setSaveState({ status: "idle", error: "", message: "" });
    scrollEditorIntoView();
  }

  function closeEditor() {
    setDraft(createOpportunityDraft());
    setEditorMode(null);
    setSaveState({ status: "idle", error: "", message: "" });
  }

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    resetSuccessState();
  }

  function updateContact(index, value) {
    setDraft((current) => ({
      ...current,
      contacts: current.contacts.map((item, itemIndex) => (itemIndex === index ? { ...item, value, type: detectContactType(value) } : item)),
    }));
    resetSuccessState();
  }

  function addContact() {
    setDraft((current) => ({
      ...current,
      contacts: [...current.contacts, createOpportunityContactDraft()],
    }));
    resetSuccessState();
  }

  function removeContact(index) {
    setDraft((current) => {
      const nextContacts = current.contacts.filter((_, itemIndex) => itemIndex !== index);

      return {
        ...current,
        contacts: nextContacts.length ? nextContacts : [createOpportunityContactDraft()],
      };
    });
    resetSuccessState();
  }

  function updateMedia(index, field, value) {
    setDraft((current) => ({
      ...current,
      media: current.media.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
    resetSuccessState();
  }

  function addMedia() {
    setDraft((current) => ({
      ...current,
      media: [...current.media, createOpportunityMediaDraft()],
    }));
    resetSuccessState();
  }

  function removeMedia(index) {
    setDraft((current) => {
      const nextMedia = current.media.filter((_, itemIndex) => itemIndex !== index);

      return {
        ...current,
        media: nextMedia.length ? nextMedia : [createOpportunityMediaDraft()],
      };
    });
    resetSuccessState();
  }

  async function startEditing(item) {
    setSaveState({ status: "idle", error: "", message: "" });

    try {
      const opportunity = await getOpportunity(item.id);
      setDraft(createOpportunityDraft(opportunity));
    } catch {
      setDraft(createOpportunityDraft(item));
    }

    setEditorMode("edit");
    scrollEditorIntoView();
  }

  async function persistOpportunity(saveMode) {
    const validationErrors = saveMode === "submit" ? validateOpportunityDraftForSubmit(draft) : [];

    if (validationErrors.length) {
      setSaveState({ status: "error", error: validationErrors[0], message: "" });
      return;
    }

    setSaveState({ status: "saving", error: "", message: "" });

    try {
      const payload = buildOpportunityPayload(draft, { saveMode });

      if (draft.id) {
        await updateOpportunity(draft.id, payload);
      } else {
        await createOpportunity(payload);
      }

      setDraft(createOpportunityDraft());
      setEditorMode(null);
      setSaveState({
        status: "success",
        error: "",
        message: saveMode === "submit" ? "Публикация отправлена на модерацию." : "Черновик сохранен.",
      });
      setReloadKey((current) => current + 1);
    } catch (error) {
      setSaveState({
        status: "error",
        error: error?.message ?? "Не удалось сохранить публикацию.",
        message: "",
      });
    }
  }

  async function handleDelete(opportunityId) {
    setSaveState({ status: "saving", error: "", message: "" });

    try {
      await deleteOpportunity(opportunityId);
      setState((current) => ({
        ...current,
        opportunities: current.opportunities.filter((item) => item.id !== opportunityId),
      }));

      if (draft.id === opportunityId) {
        closeEditor();
      }

      setSaveState({ status: "success", error: "", message: "Публикация удалена." });
    } catch (error) {
      setSaveState({
        status: "error",
        error: error?.message ?? "Не удалось удалить публикацию.",
        message: "",
      });
    }
  }

  async function handleArchive(opportunityId) {
    setSaveState({ status: "saving", error: "", message: "" });

    try {
      await updateOpportunity(opportunityId, {
        saveMode: "archive",
        moderationStatus: "archived",
      });
      setReloadKey((current) => current + 1);
      setSaveState({ status: "success", error: "", message: "Публикация архивирована." });
    } catch (error) {
      setSaveState({
        status: "error",
        error: error?.message ?? "Не удалось архивировать публикацию.",
        message: "",
      });
    }
  }

  function renderEditorActions() {
    const status = String(draft.moderationStatus ?? "draft").toLowerCase();
    const canArchive = status === "approved";
    const canSubmit = ["draft", "revision", "rejected", "archived"].includes(status);
    const canDelete = Number(draft.applicationsCount ?? 0) === 0;
    const canPreview = Boolean(draft.id);

    return (
      <div className="company-dashboard-panel__actions">
        <Button type="button" onClick={() => void persistOpportunity("draft")} disabled={saveState.status === "saving"}>
          Сохранить как черновик
        </Button>

        {canSubmit ? (
          <Button type="button" variant="secondary" onClick={() => void persistOpportunity("submit")} disabled={saveState.status === "saving"}>
            Отправить на модерацию
          </Button>
        ) : null}

        {canArchive && draft.id ? (
          <Button type="button" variant="secondary" onClick={() => void handleArchive(draft.id)} disabled={saveState.status === "saving"}>
            Снять с публикации/архивировать
          </Button>
        ) : null}

        {canPreview && draft.id ? (
          <Button type="button" variant="secondary" href={buildOpportunityPreviewRoute(draft.id)}>
            Просмотр публичной версии
          </Button>
        ) : null}

        {canDelete && draft.id ? (
          <Button type="button" variant="ghost" onClick={() => void handleDelete(draft.id)} disabled={saveState.status === "saving"}>
            Удалить
          </Button>
        ) : null}

        <Button type="button" variant="ghost" onClick={closeEditor} disabled={saveState.status === "saving"}>
          Отмена
        </Button>
      </div>
    );
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
        <Alert tone="success" title="Операция выполнена" showIcon>
          {saveState.message}
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <div className="company-dashboard-stack">
          <CabinetContentSection
            eyebrow="Список"
            title="Публикации компании"
            description="Управляйте карточками возможностей: создавайте новые публикации, открывайте форму редактирования с карточки и переходите к полной странице возможности."
            actions={(
              <Button type="button" onClick={openCreateForm} disabled={saveState.status === "saving"}>
                Создать возможность
              </Button>
            )}
          >
            {state.opportunities.length ? (
              <div className="company-dashboard-stack">
                {state.opportunities.map((item) => {
                  const presentation = getOpportunityCardPresentation(item);
                  const canDelete = Number(item.applicationsCount ?? 0) === 0;
                  const canArchive = String(item.moderationStatus ?? "").toLowerCase() === "approved";

                  return (
                    <article key={item.id} className="company-dashboard-list-item company-dashboard-list-item--opportunity">
                      <div className="company-dashboard-list-item__top">
                        <div>
                          <h3 className="ui-type-h3">{item.title}</h3>
                          <p className="ui-type-caption">
                            {presentation.type}
                            {item.locationCity ? ` • ${item.locationCity}` : ""}
                          </p>
                        </div>
                        <Badge tone={presentation.statusTone}>{presentation.status}</Badge>
                      </div>

                      <p className="ui-type-body">{item.description || "Описание пока не заполнено."}</p>

                      <div className="company-dashboard-list-item__meta-grid">
                        <div className="company-dashboard-list-item__meta-card">
                          <span>Срок</span>
                          <strong>{formatDeadlineLabel(item.expireAt)}</strong>
                        </div>
                        <div className="company-dashboard-list-item__meta-card">
                          <span>Акцент</span>
                          <strong>{presentation.accent}</strong>
                        </div>
                      </div>

                      {presentation.note ? <p className="ui-type-caption">{presentation.note}</p> : null}

                      <div className="company-dashboard-panel__actions">
                        <Button type="button" variant="secondary" href={buildOpportunityPreviewRoute(item.id)}>
                          Просмотр публичной версии
                        </Button>
                        <Button type="button" variant="secondary" href={buildOpportunityDetailRoute(item.id)}>
                          Перейти на страницу возможности
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => void startEditing(item)} disabled={saveState.status === "saving"}>
                          Редактировать
                        </Button>
                        {canArchive ? (
                          <Button type="button" variant="secondary" onClick={() => void handleArchive(item.id)} disabled={saveState.status === "saving"}>
                            Снять с публикации/архивировать
                          </Button>
                        ) : null}
                        <Button type="button" variant="ghost" onClick={() => void handleDelete(item.id)} disabled={saveState.status === "saving" || !canDelete}>
                          Удалить
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Публикаций пока нет"
                description="Создайте первую публикацию кнопкой сверху, чтобы кандидаты увидели ваши предложения."
                tone="neutral"
                compact
              />
            )}
          </CabinetContentSection>

          {editorMode ? (
            <CabinetContentSection
              ref={editorRef}
              eyebrow="Редактор"
              title={draft.id ? "Редактирование публикации" : "Новая публикация"}
              description="Заполните карточку возможности и выберите, отправить её на модерацию или оставить в черновике."
            >
              {draft.moderationStatus === "revision" || draft.moderationStatus === "rejected" ? (
                <Alert tone="warning" title="Причина возврата" showIcon>
                  {draft.moderationReason || "Модератор не оставил комментарий."}
                </Alert>
              ) : null}

              <form className="company-dashboard-stack" onSubmit={(event) => event.preventDefault()} noValidate>
                <FormField label="Название" required>
                  <Input value={draft.title} onValueChange={(value) => updateField("title", value)} />
                </FormField>

                <FormField label="Описание" required>
                  <Textarea value={draft.description} onValueChange={(value) => updateField("description", value)} rows={5} autoResize />
                </FormField>

                <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                  <FormField label="Тип публикации">
                    <Select
                      value={draft.opportunityType}
                      onValueChange={(value) => updateField("opportunityType", value)}
                      options={OPPORTUNITY_TYPE_OPTIONS}
                      disabled={Number(draft.applicationsCount ?? 0) > 0}
                    />
                  </FormField>
                  <FormField label="Формат">
                    <Select value={draft.employmentType} onValueChange={(value) => updateField("employmentType", value)} options={EMPLOYMENT_TYPE_OPTIONS} />
                  </FormField>
                </div>

                <FormField label="Срок или дата">
                  <Input type="date" value={draft.expireAt} onValueChange={(value) => updateField("expireAt", value)} />
                </FormField>

                {renderTypedFields({
                  draft,
                  onFieldChange: updateField,
                  isEditingExisting: editorMode === "edit",
                })}

                <OpportunityLocationPicker
                  locationCity={draft.locationCity}
                  locationAddress={draft.locationAddress}
                  latitude={draft.latitude}
                  longitude={draft.longitude}
                  onFieldChange={updateField}
                />

                <FormField label="Теги через запятую">
                  <Input value={draft.tags} onValueChange={(value) => updateField("tags", value)} />
                </FormField>

                <FormField label="Контакты / ссылки">
                  <div className="company-dashboard-social-links">
                    {draft.contacts.map((item, index) => (
                      <div className="company-dashboard-social-links__row" key={`opportunity-contact-${index}`}>
                        <Input
                          value={item.value}
                          onValueChange={(value) => updateContact(index, value)}
                          placeholder={getContactPlaceholder(item.value)}
                        />
                        <Button type="button" variant="ghost" onClick={() => removeContact(index)}>
                          Удалить
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="secondary" onClick={addContact}>
                      Добавить
                    </Button>
                  </div>
                </FormField>

                <FormField label="Медиа / вложения">
                  <div className="company-dashboard-social-links">
                    {draft.media.map((item, index) => (
                      <div className="company-dashboard-social-links__row" key={`opportunity-media-${index}`}>
                        <Input value={item.title} onValueChange={(value) => updateMedia(index, "title", value)} placeholder="Название медиа" />
                        <Input value={item.url} onValueChange={(value) => updateMedia(index, "url", value)} placeholder="https://..." />
                        <Button type="button" variant="ghost" onClick={() => removeMedia(index)}>
                          Удалить
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="secondary" onClick={addMedia}>
                      Добавить
                    </Button>
                  </div>
                </FormField>

                {renderEditorActions()}
              </form>
            </CabinetContentSection>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
