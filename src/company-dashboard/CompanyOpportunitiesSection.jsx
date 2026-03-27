import { useEffect, useState } from "react";
import { getCompanyOpportunities } from "../api/company";
import { createOpportunity, deleteOpportunity, updateOpportunity } from "../api/opportunities";
import { ApiError } from "../lib/http";
import { Alert, Badge, Button, EmptyState, FormField, Input, Loader, Select, Textarea } from "../shared/ui";
import { CabinetContentSection } from "../widgets/layout";
import {
  createOpportunityContactDraft,
  createOpportunityDraft,
  normalizeOpportunityContacts,
  OPPORTUNITY_CONTACT_TYPE_OPTIONS,
  parseOpportunityDeadlineInput,
  parseTags,
  serializeOpportunityContacts,
  translateModerationStatus,
  translateOpportunityType,
} from "./utils";
import "./company-dashboard.css";

const OPPORTUNITY_TYPE_OPTIONS = [
  { value: "vacancy", label: "Вакансия" },
  { value: "internship", label: "Стажировка" },
  { value: "event", label: "Мероприятие" },
];

const CONTACT_TYPE_META = {
  phone: {
    label: "Телефон",
    eyebrow: "Позвонить",
    placeholder: "+7 (999) 123-45-67",
    hint: "Укажите номер, по которому кандидат сможет быстро связаться с вами.",
  },
  email: {
    label: "Email",
    eyebrow: "Написать",
    placeholder: "team@company.ru",
    hint: "Подойдет рабочая почта для откликов и уточняющих вопросов.",
  },
  link: {
    label: "Ссылка",
    eyebrow: "Перейти",
    placeholder: "https://t.me/company или https://company.ru/careers",
    hint: "Добавьте сайт, Telegram, форму записи или другую ссылку для связи.",
  },
};

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

function getContactSummary(items) {
  const filledCount = (Array.isArray(items) ? items : []).filter((item) => String(item?.value ?? "").trim()).length;

  if (!filledCount) {
    return "Контакты для связи еще не добавлены.";
  }

  if (filledCount === 1) {
    return "1 контакт для связи";
  }

  if (filledCount < 5) {
    return `${filledCount} контакта для связи`;
  }

  return `${filledCount} контактов для связи`;
}

function OpportunityContactEditor({ item, index, onChange, onRemove, canRemove }) {
  const meta = CONTACT_TYPE_META[item.type] ?? CONTACT_TYPE_META.link;

  return (
    <article className="ui-card ui-card--neutral company-dashboard-opportunity-contact-card">
      <div className="company-dashboard-opportunity-contact-card__head">
        <div className="company-dashboard-opportunity-contact-card__avatar" aria-hidden="true">
          {meta.label.slice(0, 1)}
        </div>
        <div className="company-dashboard-opportunity-contact-card__copy">
          <span>{meta.eyebrow}</span>
          <strong>{meta.label} {index + 1}</strong>
        </div>
      </div>

      <div className="company-dashboard-opportunity-contact-card__fields">
        <FormField label="Тип контакта">
          <Select value={item.type} onValueChange={(value) => onChange(index, "type", value)} options={OPPORTUNITY_CONTACT_TYPE_OPTIONS} />
        </FormField>

        <FormField label="Контакт" hint={meta.hint}>
          <Input value={item.value} onValueChange={(value) => onChange(index, "value", value)} placeholder={meta.placeholder} />
        </FormField>
      </div>

      <div className="company-dashboard-opportunity-contact-card__actions">
        <Button type="button" variant="ghost" onClick={() => onRemove(index)} disabled={!canRemove}>
          Удалить
        </Button>
      </div>
    </article>
  );
}

export function CompanyOpportunitiesSection() {
  const [state, setState] = useState({ status: "loading", opportunities: [], error: null });
  const [draft, setDraft] = useState(createOpportunityDraft());
  const [saveState, setSaveState] = useState({ status: "idle", error: "" });
  const [reloadKey, setReloadKey] = useState(0);

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

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaveState((current) => (current.status === "success" ? { status: "idle", error: "" } : current));
  }

  function updateContact(index, field, value) {
    setDraft((current) => ({
      ...current,
      contacts: current.contacts.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
    setSaveState((current) => (current.status === "success" ? { status: "idle", error: "" } : current));
  }

  function addContact() {
    setDraft((current) => ({
      ...current,
      contacts: [...current.contacts, createOpportunityContactDraft()],
    }));
    setSaveState((current) => (current.status === "success" ? { status: "idle", error: "" } : current));
  }

  function removeContact(index) {
    setDraft((current) => {
      const nextContacts = current.contacts.filter((_, itemIndex) => itemIndex !== index);

      return {
        ...current,
        contacts: nextContacts.length ? nextContacts : [createOpportunityContactDraft()],
      };
    });
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

    const contactsJson = serializeOpportunityContacts(draft.contacts);
    if (!contactsJson) {
      setSaveState({ status: "error", error: "Добавьте хотя бы один контакт для связи." });
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
        expireAt: parseOpportunityDeadlineInput(draft.expireAt),
        contactsJson,
        tags: parseTags(draft.tags),
      };

      if (draft.id) {
        await updateOpportunity(draft.id, payload);
      } else {
        await createOpportunity(payload);
      }

      resetForm();
      setSaveState({ status: "success", error: "" });
      setReloadKey((current) => current + 1);
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
          Публикация обновлена. При необходимости она снова пройдет проверку перед показом кандидатам.
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <div className="company-dashboard-stack">
          <CabinetContentSection
            eyebrow="Публикации"
            title={draft.id ? "Редактирование публикации" : "Новая публикация"}
            description="Заполните карточку возможности: опишите предложение, укажите срок и добавьте контакты, по которым кандидат сможет связаться с вашей командой."
          >
            <form className="company-dashboard-stack" onSubmit={handleSubmit} noValidate>
              <FormField label="Название" required>
                <Input value={draft.title} onValueChange={(value) => updateField("title", value)} />
              </FormField>

              <FormField label="Описание" required>
                <Textarea value={draft.description} onValueChange={(value) => updateField("description", value)} rows={5} autoResize />
              </FormField>

              <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                <FormField label="Тип публикации">
                  <Select value={draft.opportunityType} onValueChange={(value) => updateField("opportunityType", value)} options={OPPORTUNITY_TYPE_OPTIONS} />
                </FormField>
                <FormField label="Срок или дата">
                  <Input type="date" value={draft.expireAt} onValueChange={(value) => updateField("expireAt", value)} />
                </FormField>
              </div>

              <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                <FormField label="Город">
                  <Input value={draft.locationCity} onValueChange={(value) => updateField("locationCity", value)} />
                </FormField>
                <FormField label="Адрес">
                  <Input value={draft.locationAddress} onValueChange={(value) => updateField("locationAddress", value)} />
                </FormField>
              </div>

              <FormField label="Теги через запятую">
                <Input value={draft.tags} onValueChange={(value) => updateField("tags", value)} />
              </FormField>

              <section className="company-dashboard-opportunity-contacts" aria-label="Контакты для публикации">
                <div className="company-dashboard-opportunity-contacts__header">
                  <div>
                    <p className="company-dashboard-opportunity-contacts__eyebrow">Контакты для связи</p>
                    <h3 className="ui-type-h3">Список контактов</h3>
                    <p className="ui-type-body">Добавьте телефон, почту или ссылку. Кандидат увидит их в карточке возможности.</p>
                  </div>
                  <Button type="button" variant="secondary" onClick={addContact}>
                    Добавить контакт
                  </Button>
                </div>

                <div className="company-dashboard-opportunity-contacts__list">
                  {draft.contacts.map((item, index) => (
                    <OpportunityContactEditor
                      key={`${item.type}-${index}`}
                      item={item}
                      index={index}
                      onChange={updateContact}
                      onRemove={removeContact}
                      canRemove={draft.contacts.length > 1}
                    />
                  ))}
                </div>
              </section>

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
            description="Здесь отображаются все активные публикации компании. Вы можете отредактировать их, обновить контакты или удалить ненужные карточки."
          >
            {state.opportunities.length ? (
              <div className="company-dashboard-stack">
                {state.opportunities.map((item) => (
                  <article key={item.id} className="company-dashboard-list-item company-dashboard-list-item--opportunity">
                    <div className="company-dashboard-list-item__top">
                      <div>
                        <h3 className="ui-type-h3">{item.title}</h3>
                        <p className="ui-type-caption">
                          {translateOpportunityType(item.opportunityType)}
                          {item.locationCity ? ` • ${item.locationCity}` : ""}
                        </p>
                      </div>
                      <Badge tone={item.moderationStatus === "approved" ? "success" : item.moderationStatus === "revision" ? "warning" : "neutral"}>
                        {translateModerationStatus(item.moderationStatus)}
                      </Badge>
                    </div>

                    <p className="ui-type-body">{item.description || "Описание пока не заполнено."}</p>

                    <div className="company-dashboard-list-item__meta-grid">
                      <div className="company-dashboard-list-item__meta-card">
                        <span>Срок</span>
                        <strong>{formatDeadlineLabel(item.expireAt)}</strong>
                      </div>
                      <div className="company-dashboard-list-item__meta-card">
                        <span>Контакты</span>
                        <strong>{getContactSummary(normalizeOpportunityContacts(item.contactsJson))}</strong>
                      </div>
                      <div className="company-dashboard-list-item__meta-card">
                        <span>Отклики</span>
                        <strong>{item.applicationsCount}</strong>
                      </div>
                    </div>

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
