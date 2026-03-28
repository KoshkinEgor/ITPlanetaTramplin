import { useEffect, useMemo, useState } from "react";
import { decideUserModeration, getModerationUser, getModerationUsers, updateModerationUser } from "../api/moderation";
import { getCandidateProfileLinks } from "../candidate-portal/onboarding";
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
import { ModeratorFilterPill, ModeratorSearchBar, ModeratorStatusBadge } from "./shared";

const USER_FILTERS = [
  { value: "all", label: "Все" },
  { value: "candidate", label: "Соискатели" },
  { value: "company", label: "Работодатели" },
  { value: "moderator", label: "Модераторы" },
  { value: "verified", label: "Подтвержденные" },
];

const MODERATION_STATUS_OPTIONS = [
  { value: "pending", label: "На проверке" },
  { value: "approved", label: "Одобрено" },
  { value: "revision", label: "Доработка" },
  { value: "rejected", label: "Отклонено" },
];

const VISIBILITY_OPTIONS = [
  { value: "everyone", label: "Все пользователи" },
  { value: "employers-and-contacts", label: "Работодатели и контакты" },
  { value: "contacts", label: "Только контакты" },
  { value: "nobody", label: "Только я" },
];

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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

function translateRole(role) {
  switch (role) {
    case "candidate":
      return "Соискатель";
    case "company":
      return "Работодатель";
    case "moderator":
      return "Модератор";
    default:
      return role || "Роль не указана";
  }
}

function translateModerationStatus(status) {
  switch (normalize(status)) {
    case "approved":
      return { label: "Одобрено", tone: "approved" };
    case "revision":
      return { label: "Доработка", tone: "revision" };
    case "rejected":
      return { label: "Отклонено", tone: "rejected" };
    default:
      return { label: "На проверке", tone: "pending" };
  }
}

function getUserDisplayName(item) {
  const displayName = String(item?.displayName ?? "").trim();
  if (displayName) {
    return displayName;
  }

  const fullName = [item?.name, item?.surname, item?.thirdname]
    .map((part) => normalizeText(part))
    .filter(Boolean)
    .join(" ");

  if (fullName) {
    return fullName;
  }

  const email = String(item?.email ?? "").trim();
  return email || "Пользователь";
}

function shouldShowUserEmail(item) {
  const email = String(item?.email ?? "").trim();
  return Boolean(email) && normalize(email) !== normalize(getUserDisplayName(item));
}

function getUserStatusPresentation(item) {
  if (normalize(item?.role) === "candidate" && item?.moderationStatus) {
    return translateModerationStatus(item.moderationStatus);
  }

  return item?.isVerified
    ? { label: "Подтвержден", tone: "approved" }
    : { label: "Не подтвержден", tone: "pending" };
}

function createCandidateDraft(detail) {
  const links = getCandidateProfileLinks(detail);
  const onboarding = isRecord(links.onboarding) ? links.onboarding : {};
  const contacts = isRecord(links.contacts) ? links.contacts : {};
  const preferences = isRecord(links.preferences) ? links.preferences : {};
  const visibility = isRecord(preferences.visibility) ? preferences.visibility : {};

  return {
    name: normalizeText(detail?.name),
    surname: normalizeText(detail?.surname),
    thirdname: normalizeText(detail?.thirdname),
    description: normalizeText(detail?.description),
    skills: Array.isArray(detail?.skills) ? detail.skills.join(", ") : "",
    city: normalizeText(onboarding.city),
    phone: normalizeText(onboarding.phone),
    telegram: normalizeText(contacts.telegram),
    vk: normalizeText(contacts.vk),
    behance: normalizeText(contacts.behance),
    portfolio: normalizeText(contacts.portfolio),
    profileVisibility: normalizeText(visibility.profileVisibility) || "employers-and-contacts",
    moderationStatus: normalizeText(detail?.moderationStatus) || "pending",
  };
}

function buildCandidatePayload(detail, draft) {
  const links = getCandidateProfileLinks(detail);
  const onboarding = isRecord(links.onboarding) ? links.onboarding : {};
  const contacts = isRecord(links.contacts) ? links.contacts : {};
  const preferences = isRecord(links.preferences) ? links.preferences : {};
  const visibility = isRecord(preferences.visibility) ? preferences.visibility : {};

  return {
    name: normalizeText(draft.name) || null,
    surname: normalizeText(draft.surname) || null,
    thirdname: normalizeText(draft.thirdname) || null,
    description: normalizeText(draft.description) || null,
    skills: normalizeText(draft.skills)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    links: {
      ...links,
      onboarding: {
        ...onboarding,
        city: normalizeText(draft.city) || null,
        phone: normalizeText(draft.phone) || null,
      },
      contacts: {
        ...contacts,
        telegram: normalizeText(draft.telegram) || null,
        vk: normalizeText(draft.vk) || null,
        behance: normalizeText(draft.behance) || null,
        portfolio: normalizeText(draft.portfolio) || null,
      },
      preferences: {
        ...preferences,
        visibility: {
          ...visibility,
          profileVisibility: normalizeText(draft.profileVisibility) || "employers-and-contacts",
        },
      },
    },
  };
}

function UserRow({ item, selected, onSelect }) {
  const status = getUserStatusPresentation(item);

  return (
    <button type="button" className={`moderator-table__row ${selected ? "is-active" : ""}`.trim()} onClick={() => onSelect(item.id)}>
      <span className="moderator-table__cell moderator-table__cell--stack">
        <span className="moderator-table__title">{getUserDisplayName(item)}</span>
        {shouldShowUserEmail(item) ? <span className="moderator-table__meta">{item.email}</span> : null}
      </span>
      <span className="moderator-table__cell">{translateRole(item.role)}</span>
      <span className="moderator-table__cell">{formatDate(item.createdAt)}</span>
      <span className="moderator-table__cell moderator-table__cell--status">
        <ModeratorStatusBadge label={status.label} tone={status.tone} />
      </span>
    </button>
  );
}

export function ModeratorUsersApp() {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ status: "loading", items: [], error: null });
  const [detailState, setDetailState] = useState({ status: "idle", detail: null, error: null });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saveState, setSaveState] = useState({ status: "idle", error: "" });
  const [decisionState, setDecisionState] = useState({ status: "idle", error: "" });
  const [decision, setDecision] = useState("approved");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const items = await getModerationUsers(controller.signal);
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
      const haystack = normalize([getUserDisplayName(item), item.email, item.role, translateRole(item.role)].join(" "));
      const matchesFilter =
        statusFilter === "all"
          ? true
          : statusFilter === "verified"
            ? item.isVerified
            : item.role === statusFilter;

      return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [query, state.items, statusFilter]);

  const activeListItem = filteredItems.find((item) => item.id === selectedId) ?? state.items.find((item) => item.id === selectedId) ?? null;
  const activeItem = detailState.detail ?? activeListItem;
  const isCandidateActive = normalize(activeListItem?.role) === "candidate";

  useEffect(() => {
    if (selectedId === null) {
      return;
    }

    if (!state.items.some((item) => item.id === selectedId)) {
      setSelectedId(null);
    }
  }, [selectedId, state.items]);

  useEffect(() => {
    if (!selectedId || !isCandidateActive) {
      setDetailState({ status: "idle", detail: null, error: null });
      setDraft(null);
      return;
    }

    const controller = new AbortController();

    async function loadDetail() {
      setDetailState({ status: "loading", detail: null, error: null });

      try {
        const detail = await getModerationUser(selectedId, controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setDetailState({ status: "ready", detail, error: null });
        setDraft(createCandidateDraft(detail));
        setDecision(normalizeText(detail?.moderationStatus) || "pending");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setDetailState({ status: "error", detail: null, error });
      }
    }

    loadDetail();
    return () => controller.abort();
  }, [isCandidateActive, reloadKey, selectedId]);

  function handleSelect(nextId) {
    setSelectedId((current) => (current === nextId ? null : nextId));
    setSaveState({ status: "idle", error: "" });
    setDecisionState({ status: "idle", error: "" });
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...(current ?? {}), [field]: value }));
    setSaveState((current) => (current.status === "success" ? { status: "idle", error: "" } : current));
  }

  async function handleSave() {
    if (!selectedId || !isCandidateActive || !detailState.detail || !draft) {
      return;
    }

    if (!normalizeText(draft.name) || !normalizeText(draft.surname)) {
      setSaveState({ status: "error", error: "Укажите имя и фамилию кандидата." });
      return;
    }

    setSaveState({ status: "saving", error: "" });

    try {
      await updateModerationUser(selectedId, buildCandidatePayload(detailState.detail, draft));
      const refreshed = await getModerationUser(selectedId);
      setDetailState({ status: "ready", detail: refreshed, error: null });
      setDraft(createCandidateDraft(refreshed));
      setSaveState({ status: "success", error: "" });
      setReloadKey((current) => current + 1);
    } catch (error) {
      setSaveState({
        status: "error",
        error: error?.message ?? "Не удалось сохранить анкету кандидата.",
      });
    }
  }

  async function handleDecisionSave() {
    if (!selectedId || !isCandidateActive) {
      return;
    }

    setDecisionState({ status: "saving", error: "" });

    try {
      await decideUserModeration(selectedId, decision);
      const refreshed = await getModerationUser(selectedId);
      setDetailState({ status: "ready", detail: refreshed, error: null });
      setDraft(createCandidateDraft(refreshed));
      setDecision(normalizeText(refreshed?.moderationStatus) || decision);
      setDecisionState({ status: "success", error: "" });
      setReloadKey((current) => current + 1);
    } catch (error) {
      setDecisionState({
        status: "error",
        error: error?.message ?? "Не удалось обновить moderation status.",
      });
    }
  }

  const activeStatus = getUserStatusPresentation(activeItem);

  return (
    <>
      <DashboardPageHeader
        title="Пользователи платформы"
        description="Обзор состава платформы, ролей и moderation-статусов без локальных заглушек."
      />

      <div className="moderator-toolbar-stack">
        <ModeratorSearchBar value={query} onChange={setQuery} placeholder="Поиск по имени, email или роли" />
        <div className="moderator-panel__filters moderator-fade-up moderator-fade-up--delay-1">
          {USER_FILTERS.map((filter) => (
            <ModeratorFilterPill
              key={filter.value}
              label={filter.label}
              active={filter.value === statusFilter}
              onClick={() => setStatusFilter(filter.value)}
            />
          ))}
        </div>
      </div>

      {state.status === "loading" ? <Loader label="Загружаем пользователей" surface /> : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить пользователей" showIcon>
          {state.error?.message ?? "Попробуйте повторить позже."}
        </Alert>
      ) : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Доступ ограничен"
            title="Нужна роль модератора"
            description="Список пользователей доступен только модератору."
            tone="warning"
          />
        </Card>
      ) : null}

      {state.status === "ready" ? (
        <section className="moderator-review-grid">
          <Card className="moderator-panel moderator-panel--list moderator-fade-up moderator-fade-up--delay-2">
            <div className="moderator-panel__head moderator-panel__head--queue">
              <div className="moderator-panel__copy">
                <Tag tone="accent">Пользователи</Tag>
                <h2 className="ui-type-h2">Список профилей</h2>
                <p className="ui-type-body">Выберите пользователя из списка, чтобы открыть модальное окно и при необходимости отредактировать карточку кандидата.</p>
              </div>
              <span className="moderator-panel__counter">{filteredItems.length}</span>
            </div>

            {filteredItems.length ? (
              <div className="moderator-table moderator-table--users">
                <div className="moderator-table__header">
                  <span>Имя</span>
                  <span>Роль</span>
                  <span>Дата</span>
                  <span>Статус</span>
                </div>
                <div className="moderator-table__body">
                  {filteredItems.map((item) => (
                    <UserRow key={item.id} item={item} selected={item.id === activeItem?.id} onSelect={handleSelect} />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Пользователи не найдены" description="Попробуйте изменить фильтр или поисковый запрос." tone="neutral" compact />
            )}
          </Card>
        </section>
      ) : null}

      <Modal
        open={Boolean(activeListItem)}
        onClose={() => setSelectedId(null)}
        title="Карточка пользователя"
        description={isCandidateActive ? "Редактирование основной публичной анкеты кандидата и moderation status." : "Для этой роли доступен обзор без редактирования анкеты."}
        size="lg"
        closeLabel="Закрыть окно пользователя"
        className="moderator-user-modal"
      >
        {activeListItem ? (
          <div className="moderator-detail-surface moderator-detail-surface--modal">
            <div className="moderator-detail-surface__top">
              <Tag tone="accent">{translateRole(activeListItem.role)}</Tag>
              <ModeratorStatusBadge label={activeStatus.label} tone={activeStatus.tone} />
            </div>

            <div className="moderator-detail-surface__copy">
              <h3 className="ui-type-h3">{getUserDisplayName(activeItem)}</h3>
              {shouldShowUserEmail(activeItem) ? <p className="moderator-detail-surface__meta">{activeItem.email}</p> : null}
            </div>

            <dl className="moderator-detail-facts moderator-detail-facts--stack">
              <div>
                <dt>Роль</dt>
                <dd>{translateRole(activeListItem.role)}</dd>
              </div>
              <div>
                <dt>Дата регистрации</dt>
                <dd>{formatDate(activeItem.createdAt)}</dd>
              </div>
              <div>
                <dt>Допуск ко входу</dt>
                <dd>{activeItem.preVerify ? "Да" : "Нет"}</dd>
              </div>
              <div>
                <dt>Подтверждение email</dt>
                <dd>{activeItem.isVerified ? "Да" : "Нет"}</dd>
              </div>
            </dl>

            {detailState.status === "loading" && isCandidateActive ? <Loader label="Загружаем анкету кандидата" surface /> : null}

            {detailState.status === "error" ? (
              <Alert tone="error" title="Не удалось загрузить карточку кандидата" showIcon>
                {detailState.error?.message ?? "Попробуйте открыть профиль ещё раз."}
              </Alert>
            ) : null}

            {saveState.status === "error" ? (
              <Alert tone="error" title="Изменения не сохранены" showIcon>
                {saveState.error}
              </Alert>
            ) : null}

            {saveState.status === "success" ? (
              <Alert tone="success" title="Анкета обновлена" showIcon>
                Основная карточка кандидата сохранена через moderation API.
              </Alert>
            ) : null}

            {decisionState.status === "error" ? (
              <Alert tone="error" title="Статус не обновлен" showIcon>
                {decisionState.error}
              </Alert>
            ) : null}

            {decisionState.status === "success" ? (
              <Alert tone="success" title="Статус обновлен" showIcon>
                Moderation status кандидата сохранен.
              </Alert>
            ) : null}

            {!isCandidateActive ? (
              <p className="ui-type-body moderator-detail-surface__description">
                Для работодателей и модераторов на этом экране доступен только обзор учетной записи. Редактирование через moderation workflow используется только для карточек кандидатов.
              </p>
            ) : null}

            {isCandidateActive && detailState.status === "ready" && draft ? (
              <div className="moderator-dashboard-stack">
                <section className="moderator-detail-group">
                  <h4 className="ui-type-h3">Основная анкета</h4>

                  <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                    <FormField label="Имя" required>
                      <Input value={draft.name} onValueChange={(value) => updateDraft("name", value)} />
                    </FormField>
                    <FormField label="Фамилия" required>
                      <Input value={draft.surname} onValueChange={(value) => updateDraft("surname", value)} />
                    </FormField>
                  </div>

                  <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                    <FormField label="Отчество">
                      <Input value={draft.thirdname} onValueChange={(value) => updateDraft("thirdname", value)} />
                    </FormField>
                    <FormField label="Город">
                      <Input value={draft.city} onValueChange={(value) => updateDraft("city", value)} />
                    </FormField>
                  </div>

                  <FormField label="Описание">
                    <Textarea value={draft.description} onValueChange={(value) => updateDraft("description", value)} rows={4} autoResize />
                  </FormField>

                  <FormField label="Навыки через запятую">
                    <Input value={draft.skills} onValueChange={(value) => updateDraft("skills", value)} />
                  </FormField>

                  <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                    <FormField label="Телефон">
                      <Input value={draft.phone} onValueChange={(value) => updateDraft("phone", value)} />
                    </FormField>
                    <FormField label="Видимость анкеты">
                      <Select value={draft.profileVisibility} onValueChange={(value) => updateDraft("profileVisibility", value)} options={VISIBILITY_OPTIONS} />
                    </FormField>
                  </div>

                  <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                    <FormField label="Telegram">
                      <Input value={draft.telegram} onValueChange={(value) => updateDraft("telegram", value)} />
                    </FormField>
                    <FormField label="VK">
                      <Input value={draft.vk} onValueChange={(value) => updateDraft("vk", value)} />
                    </FormField>
                  </div>

                  <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                    <FormField label="Behance">
                      <Input value={draft.behance} onValueChange={(value) => updateDraft("behance", value)} />
                    </FormField>
                    <FormField label="Портфолио">
                      <Input value={draft.portfolio} onValueChange={(value) => updateDraft("portfolio", value)} />
                    </FormField>
                  </div>

                  <div className="company-dashboard-panel__actions">
                    <Button type="button" onClick={handleSave} disabled={saveState.status === "saving"}>
                      {saveState.status === "saving" ? "Сохраняем..." : "Сохранить анкету"}
                    </Button>
                  </div>
                </section>

                <section className="moderator-detail-group">
                  <h4 className="ui-type-h3">Moderation status</h4>
                  <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                    <FormField label="Статус проверки">
                      <Select value={decision} onValueChange={setDecision} options={MODERATION_STATUS_OPTIONS} />
                    </FormField>
                  </div>
                  <div className="company-dashboard-panel__actions">
                    <Button type="button" variant="secondary" onClick={handleDecisionSave} disabled={decisionState.status === "saving"}>
                      {decisionState.status === "saving" ? "Обновляем..." : "Обновить статус"}
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
