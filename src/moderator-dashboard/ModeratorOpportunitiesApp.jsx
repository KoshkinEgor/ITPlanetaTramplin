import { useEffect, useMemo, useState } from "react";
import { decideOpportunityModeration, getModerationOpportunities, getModerationOpportunity, updateModerationOpportunity } from "../api/moderation";
import { ApiError } from "../lib/http";
import {
  Alert,
  Button,
  Card,
  DashboardPageHeader,
  EmptyState,
  FormField,
  Input,
  Loader,
  Modal,
  Select,
  Tag,
  Textarea,
} from "../shared/ui";
import { OPPORTUNITY_TYPE_OPTIONS, translateOpportunityType as translateSharedOpportunityType } from "../shared/lib/opportunityTypes";
import { createOpportunityDraft, getOpportunityDetailPresentation, getOpportunityCardPresentation } from "../shared/lib/opportunityPresentation";
import { ModeratorFilterPill, ModeratorSearchBar, ModeratorStatusBadge } from "./shared";
import {
  createOpportunityContactDraft,
  createOpportunityMediaDraft,
  parseOpportunityCoordinateInput,
  parseOpportunityDeadlineInput,
  parseTags,
  serializeOpportunityContacts,
  serializeOpportunityMedia,
} from "../company-dashboard/utils";

const MODERATION_FILTERS = [
  { value: "all", label: "Все" },
  { value: "pending", label: "На проверке" },
  { value: "approved", label: "Одобрено" },
  { value: "revision", label: "Доработка" },
  { value: "rejected", label: "Отклонено" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "office", label: "Офис" },
  { value: "hybrid", label: "Гибрид" },
  { value: "remote", label: "Удаленно" },
  { value: "online", label: "Онлайн" },
];

const DECISION_OPTIONS = [
  { value: "pending", label: "На проверке" },
  { value: "approved", label: "Одобрить" },
  { value: "revision", label: "Вернуть на доработку" },
  { value: "rejected", label: "Отклонить" },
];

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function translateOpportunityType(value) {
  return translateSharedOpportunityType(value);
}

function translateStatus(status) {
  switch (normalize(status)) {
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

function getOpportunityLocation(item) {
  return item.locationCity || item.locationAddress || "Не указана";
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

function OpportunityRow({ item, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`moderator-table__row ${selected ? "is-active" : ""}`.trim()}
      aria-pressed={selected}
      onClick={() => onSelect(item.id)}
    >
      <span className="moderator-table__cell moderator-table__cell--title">{item.title}</span>
      <span className="moderator-table__cell">{item.companyName}</span>
      <span className="moderator-table__cell">
        <Tag>{translateOpportunityType(item.opportunityType)}</Tag>
      </span>
      <span className="moderator-table__cell">{formatDate(item.publishAt)}</span>
      <span className="moderator-table__cell moderator-table__cell--status">
        <ModeratorStatusBadge label={translateStatus(item.moderationStatus)} tone={item.moderationStatus} />
      </span>
    </button>
  );
}

function OpportunityCompactCard({ item, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`moderator-opportunity-compact ${selected ? "is-active" : ""}`.trim()}
      aria-pressed={selected}
      onClick={() => onSelect(item.id)}
    >
      <div className="moderator-opportunity-compact__top">
        <Tag>{translateOpportunityType(item.opportunityType)}</Tag>
        <ModeratorStatusBadge label={translateStatus(item.moderationStatus)} tone={item.moderationStatus} />
      </div>

      <div className="moderator-opportunity-compact__copy">
        <strong className="moderator-opportunity-compact__title">{item.title}</strong>
        <span className="moderator-opportunity-compact__company">{item.companyName}</span>
      </div>

      <div className="moderator-opportunity-compact__meta">
        <span>{getOpportunityLocation(item)}</span>
        <span>{formatDate(item.publishAt)}</span>
      </div>
    </button>
  );
}

export function ModeratorOpportunitiesApp() {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ status: "loading", items: [], error: null });
  const [detailState, setDetailState] = useState({ status: "idle", detail: null, error: null });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [decision, setDecision] = useState("approved");
  const [decisionReason, setDecisionReason] = useState("");
  const [saveState, setSaveState] = useState({ status: "idle", error: "" });
  const [decisionState, setDecisionState] = useState({ status: "idle", error: "" });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const items = await getModerationOpportunities(controller.signal);
        const normalizedItems = Array.isArray(items) ? items : [];
        setState({ status: "ready", items: normalizedItems, error: null });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({ status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error", items: [], error });
      }
    }

    load();
    return () => controller.abort();
  }, [reloadKey]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalize(query);

    return state.items.filter((item) => {
      const haystack = normalize([item.title, item.companyName, item.opportunityType, item.locationCity, item.locationAddress].join(" "));
      const matchesFilter = statusFilter === "all" ? true : item.moderationStatus === statusFilter;
      return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [query, state.items, statusFilter]);

  const activeItem = detailState.detail ?? filteredItems.find((item) => item.id === selectedId) ?? state.items.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId === null) {
      return;
    }

    if (!state.items.some((item) => item.id === selectedId)) {
      setSelectedId(null);
    }
  }, [selectedId, state.items]);

  useEffect(() => {
    if (!selectedId) {
      setDetailState({ status: "idle", detail: null, error: null });
      setDraft(null);
      return;
    }

    const controller = new AbortController();

    async function loadDetail() {
      setDetailState({ status: "loading", detail: null, error: null });

      try {
        const detail = await getModerationOpportunity(selectedId, controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setDetailState({ status: "ready", detail, error: null });
        setDraft(createOpportunityDraft(detail));
        setDecision(normalize(detail?.moderationStatus) || "approved");
        setDecisionReason(detail?.moderationReason ?? "");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setDetailState({ status: "error", detail: null, error });
      }
    }

    loadDetail();
    return () => controller.abort();
  }, [reloadKey, selectedId]);

  function handleOpportunitySelect(nextId) {
    setSelectedId((current) => (current === nextId ? null : nextId));
    setSaveState({ status: "idle", error: "" });
    setDecisionState({ status: "idle", error: "" });
  }

  function updateField(field, value) {
    setDraft((current) => ({ ...(current ?? {}), [field]: value }));
    setSaveState((current) => (current.status === "success" ? { status: "idle", error: "" } : current));
  }

  function updateContact(index, value) {
    setDraft((current) => ({
      ...current,
      contacts: current.contacts.map((item, itemIndex) => (itemIndex === index ? { ...item, value, type: detectContactType(value) } : item)),
    }));
  }

  function addContact() {
    setDraft((current) => ({
      ...current,
      contacts: [...current.contacts, createOpportunityContactDraft()],
    }));
  }

  function removeContact(index) {
    setDraft((current) => {
      const nextContacts = current.contacts.filter((_, itemIndex) => itemIndex !== index);
      return {
        ...current,
        contacts: nextContacts.length ? nextContacts : [createOpportunityContactDraft()],
      };
    });
  }

  function updateMedia(index, field, value) {
    setDraft((current) => ({
      ...current,
      media: current.media.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  }

  function addMedia() {
    setDraft((current) => ({
      ...current,
      media: [...current.media, createOpportunityMediaDraft()],
    }));
  }

  function removeMedia(index) {
    setDraft((current) => {
      const nextMedia = current.media.filter((_, itemIndex) => itemIndex !== index);
      return {
        ...current,
        media: nextMedia.length ? nextMedia : [createOpportunityMediaDraft()],
      };
    });
  }

  async function handleSave() {
    if (!selectedId || !draft) {
      return;
    }

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
      await updateModerationOpportunity(selectedId, {
        title: draft.title.trim(),
        description: draft.description.trim(),
        locationCity: draft.locationCity.trim() || null,
        locationAddress: draft.locationAddress.trim() || null,
        opportunityType: draft.opportunityType,
        employmentType: draft.employmentType,
        latitude: parseOpportunityCoordinateInput(draft.latitude),
        longitude: parseOpportunityCoordinateInput(draft.longitude),
        expireAt: parseOpportunityDeadlineInput(draft.expireAt),
        contactsJson: serializeOpportunityContacts(draft.contacts),
        mediaContentJson: serializeOpportunityMedia(draft.media),
        tags: parseTags(draft.tags),
      });

      const refreshed = await getModerationOpportunity(selectedId);
      setDetailState({ status: "ready", detail: refreshed, error: null });
      setDraft(createOpportunityDraft(refreshed));
      setSaveState({ status: "success", error: "" });
      setReloadKey((current) => current + 1);
    } catch (error) {
      setSaveState({
        status: "error",
        error: error?.message ?? "Не удалось сохранить публикацию.",
      });
    }
  }

  async function handleDecisionSave() {
    if (!selectedId) {
      return;
    }

    setDecisionState({ status: "saving", error: "" });

    try {
      await decideOpportunityModeration(selectedId, {
        status: decision,
        reason: decisionReason.trim() || null,
      });
      const refreshed = await getModerationOpportunity(selectedId);
      setDetailState({ status: "ready", detail: refreshed, error: null });
      setDraft(createOpportunityDraft(refreshed));
      setDecision(normalize(refreshed?.moderationStatus) || decision);
      setDecisionReason(refreshed?.moderationReason ?? decisionReason);
      setDecisionState({ status: "success", error: "" });
      setReloadKey((current) => current + 1);
    } catch (error) {
      setDecisionState({
        status: "error",
        error: error?.message ?? "Не удалось применить решение модерации.",
      });
    }
  }

  return (
    <>
      <DashboardPageHeader
        title="Модерация возможностей"
        description="Проверка и редактирование вакансий, стажировок, мероприятий и менторских программ в одном окне."
      />

      <div className="moderator-toolbar-stack">
        <ModeratorSearchBar value={query} onChange={setQuery} placeholder="Поиск по названию, компании или локации" />
        <div className="moderator-panel__filters moderator-fade-up moderator-fade-up--delay-1">
          {MODERATION_FILTERS.map((filter) => (
            <ModeratorFilterPill
              key={filter.value}
              label={filter.label}
              active={filter.value === statusFilter}
              onClick={() => setStatusFilter(filter.value)}
            />
          ))}
        </div>
      </div>

      {state.status === "loading" ? <Loader label="Загружаем возможности" surface /> : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить возможности" showIcon>
          {state.error?.message ?? "Попробуйте повторить позже."}
        </Alert>
      ) : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Доступ ограничен"
            title="Нужна роль модератора"
            description="Список возможностей доступен только модератору."
            tone="warning"
          />
        </Card>
      ) : null}

      {state.status === "ready" ? (
        <section className="moderator-review-grid">
          <Card className="moderator-panel moderator-panel--list moderator-fade-up moderator-fade-up--delay-2">
            <div className="moderator-panel__head moderator-panel__head--queue">
              <div className="moderator-panel__copy">
                <Tag tone="accent">Возможности</Tag>
                <h2 className="ui-type-h2">Список публикаций</h2>
                <p className="ui-type-body">Выберите карточку слева, чтобы открыть форму редактирования и смены moderation status.</p>
              </div>
              <span className="moderator-panel__counter">{filteredItems.length}</span>
            </div>

            {filteredItems.length ? (
              <>
                <div className="moderator-table-shell moderator-table-shell--opportunities">
                  <div className="moderator-table moderator-table--opportunities">
                    <div className="moderator-table__header">
                      <span>Название</span>
                      <span>Компания</span>
                      <span>Тип</span>
                      <span>Дата</span>
                      <span>Статус</span>
                    </div>
                    <div className="moderator-table__body">
                      {filteredItems.map((item) => (
                        <OpportunityRow key={item.id} item={item} selected={item.id === selectedId} onSelect={handleOpportunitySelect} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="moderator-opportunity-compact-list">
                  {filteredItems.map((item) => (
                    <OpportunityCompactCard key={item.id} item={item} selected={item.id === selectedId} onSelect={handleOpportunitySelect} />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState title="Публикации не найдены" description="Попробуйте изменить фильтр или поисковый запрос." tone="neutral" compact />
            )}
          </Card>
        </section>
      ) : null}

      <Modal
        open={Boolean(activeItem)}
        onClose={() => setSelectedId(null)}
        title="Проверка публикации"
        description="Форма использует moderation detail/update endpoints и не меняет статус автоматически."
        size="lg"
        closeLabel="Закрыть окно проверки"
        className="moderator-opportunity-modal"
      >
        {activeItem ? (
          <div className="moderator-detail-surface moderator-detail-surface--modal">
            <div className="moderator-detail-surface__top">
              <Tag>{translateOpportunityType(activeItem.opportunityType)}</Tag>
              <ModeratorStatusBadge label={translateStatus(activeItem.moderationStatus)} tone={activeItem.moderationStatus} />
            </div>

            <div className="moderator-detail-surface__copy">
              <h3 className="ui-type-h3">{activeItem.title}</h3>
              <p className="ui-type-body moderator-detail-surface__company">{activeItem.companyName}</p>
            </div>

            <dl className="moderator-detail-facts">
              <div>
                <dt>Локация:</dt>
                <dd>{getOpportunityLocation(activeItem)}</dd>
              </div>
              <div>
                <dt>Дата публикации:</dt>
                <dd>{formatDate(activeItem.publishAt)}</dd>
              </div>
              <div>
                <dt>Дата окончания:</dt>
                <dd>{formatDate(activeItem.expireAt)}</dd>
              </div>
            </dl>
            <section className="moderator-detail-group">
              <h4 className="ui-type-h3">������� ����</h4>
              <div className="moderator-detail-facts">
                <div>
                  <dt>������:</dt>
                  <dd>{getOpportunityCardPresentation(activeItem).accent || "�� ������"}</dd>
                </div>
                <div>
                  <dt>����������:</dt>
                  <dd>{getOpportunityCardPresentation(activeItem).note || "�� �������"}</dd>
                </div>
                <div>
                  <dt>��������� ��������:</dt>
                  <dd>{getOpportunityDetailPresentation(activeItem).summaryAccent || "�� �������"}</dd>
                </div>
              </div>
            </section>
            {detailState.status === "loading" ? <Loader label="Загружаем публикацию" surface /> : null}

            {detailState.status === "error" ? (
              <Alert tone="error" title="Не удалось загрузить публикацию" showIcon>
                {detailState.error?.message ?? "Попробуйте открыть карточку ещё раз."}
              </Alert>
            ) : null}

            {saveState.status === "error" ? (
              <Alert tone="error" title="Изменения не сохранены" showIcon>
                {saveState.error}
              </Alert>
            ) : null}

            {saveState.status === "success" ? (
              <Alert tone="success" title="Публикация обновлена" showIcon>
                Контент сохранен через moderation API без неявного перевода в pending.
              </Alert>
            ) : null}

            {decisionState.status === "error" ? (
              <Alert tone="error" title="Решение не применено" showIcon>
                {decisionState.error}
              </Alert>
            ) : null}

            {decisionState.status === "success" ? (
              <Alert tone="success" title="Статус обновлен" showIcon>
                Решение модерации сохранено.
              </Alert>
            ) : null}

            {detailState.status === "ready" && draft ? (
              <div className="moderator-dashboard-stack">
                <section className="moderator-detail-group">
                  <h4 className="ui-type-h3">Редактирование публикации</h4>

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
                    <FormField label="Формат">
                      <Select value={draft.employmentType} onValueChange={(value) => updateField("employmentType", value)} options={EMPLOYMENT_TYPE_OPTIONS} />
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

                  <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                    <FormField label="Широта">
                      <Input value={draft.latitude} onValueChange={(value) => updateField("latitude", value)} />
                    </FormField>
                    <FormField label="Долгота">
                      <Input value={draft.longitude} onValueChange={(value) => updateField("longitude", value)} />
                    </FormField>
                  </div>

                  <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                    <FormField label="Срок или дата">
                      <Input type="date" value={draft.expireAt} onValueChange={(value) => updateField("expireAt", value)} />
                    </FormField>
                    <FormField label="Теги через запятую">
                      <Input value={draft.tags} onValueChange={(value) => updateField("tags", value)} />
                    </FormField>
                  </div>

                  <FormField label="Контакты / ссылки">
                    <div className="company-dashboard-social-links">
                      {draft.contacts.map((item, index) => (
                        <div className="company-dashboard-social-links__row" key={`moderation-contact-${index}`}>
                          <Input
                            value={item.value}
                            onValueChange={(value) => updateContact(index, value)}
                            placeholder="https://t.me/company или team@company.ru"
                          />
                          <Button type="button" variant="ghost" onClick={() => removeContact(index)}>
                            Удалить
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="secondary" onClick={addContact}>
                        Добавить контакт
                      </Button>
                    </div>
                  </FormField>

                  <FormField label="Медиа / вложения">
                    <div className="company-dashboard-social-links">
                      {draft.media.map((item, index) => (
                        <div className="company-dashboard-social-links__row" key={`moderation-media-${index}`}>
                          <Input
                            value={item.title}
                            onValueChange={(value) => updateMedia(index, "title", value)}
                            placeholder="Название медиа"
                          />
                          <Input
                            value={item.url}
                            onValueChange={(value) => updateMedia(index, "url", value)}
                            placeholder="https://..."
                          />
                          <Button type="button" variant="ghost" onClick={() => removeMedia(index)}>
                            Удалить
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="secondary" onClick={addMedia}>
                        Добавить медиа
                      </Button>
                    </div>
                  </FormField>

                  <div className="company-dashboard-panel__actions">
                    <Button type="button" onClick={handleSave} disabled={saveState.status === "saving"}>
                      {saveState.status === "saving" ? "Сохраняем..." : "Сохранить публикацию"}
                    </Button>
                  </div>
                </section>

                <section className="moderator-detail-group">
                  <h4 className="ui-type-h3">Решение модерации</h4>
                  <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                    <FormField label="Статус модерации">
                      <Select value={decision} onValueChange={setDecision} options={DECISION_OPTIONS} />
                    </FormField>
                  </div>
                  <div className="company-dashboard-panel__actions">
                    <Button type="button" variant="secondary" onClick={handleDecisionSave} disabled={decisionState.status === "saving"}>
                      {decisionState.status === "saving" ? "Обновляем..." : "Применить решение"}
                    </Button>
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}






