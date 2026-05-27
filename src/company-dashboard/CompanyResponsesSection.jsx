import { useEffect, useMemo, useState } from "react";
import { startChat } from "../api/chats";
import { buildCandidatePublicProfileRoute, routes } from "../app/routes";
import { getCompanyOpportunities, updateOpportunityApplicationStatus, cancelAcceptedOpportunityApplication } from "../api/company";
import { cn } from "../lib/cn";
import { ApiError } from "../lib/http";
import { Alert, Badge, Button, EmptyState, FilterPill, FormField, Input, Loader, Select, Tag, Textarea, ChevronDownIcon, Modal } from "../shared/ui";
import { CabinetContentSection } from "../widgets/layout";
import { loadCompanyApplications, translateApplicationStatus } from "./utils";
import "./company-dashboard.css";

const APPLICATION_STATUS_OPTIONS = [
  { value: "submitted", label: "Отправлено" },
  { value: "reviewing", label: "На рассмотрении" },
  { value: "invited", label: "Приглашение" },
  { value: "accepted", label: "Принято" },
  { value: "rejected", label: "Отказ" },
];

const APPLICATION_FILTER_OPTIONS = [
  { value: "all", label: "Все" },
  ...APPLICATION_STATUS_OPTIONS,
  { value: "withdrawn", label: "Отозвано" },
];

const APPLICATION_SORT_OPTIONS = [
  { value: "newest", label: "Новые сначала" },
  { value: "oldest", label: "Старые сначала" },
  { value: "status", label: "По статусу" },
  { value: "opportunity", label: "По возможности" },
];

const ALL_FILTER_VALUE = "all";

function normalizeSearchValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getApplicationDateValue(item) {
  const value = item?.createdAt ?? item?.appliedAt ?? item?.submittedAt ?? item?.updatedAt ?? null;
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.getTime() : 0;
}
function normalizeApplicationSkills(skills) {
  return Array.isArray(skills)
    ? skills.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)
    : [];
}

function buildApplicationLinks(item) {
  const profileHref = buildCandidatePublicProfileRoute({
    userId: item?.candidateUserId ?? item?.applicantUserId ?? null,
    name: item?.candidateName,
    email: item?.candidateEmail,
    skills: normalizeApplicationSkills(item?.candidateSkills),
  });
  const explicitResumeHref = [
    item?.resumeDownloadUrl,
    item?.resumeUrl,
    item?.resumeFileUrl,
    item?.candidateResumeUrl,
  ].find((value) => typeof value === "string" && value.trim());

  return {
    profileHref,
    resumeHref: explicitResumeHref?.trim() || `${profileHref}#resume`,
  };
}

function CompanyApplicationCard({ item, edit, isOpen, onToggle, onEditChange, onSave, onStartChat, onCancelAccepted, busyId, chatBusyId }) {
  const isSaving = busyId === item.id;
  const isStartingChat = chatBusyId === item.id;
  const isAccepted = item.status === "accepted";
  const isWithdrawn = item.status === "withdrawn";
  const contentId = `company-dashboard-response-${item.id}`;
  const skills = normalizeApplicationSkills(item.candidateSkills).slice(0, 4);
  const { profileHref, resumeHref } = buildApplicationLinks(item);

  return (
    <article className={cn("company-dashboard-response", isOpen && "is-open")}>
      <div className="company-dashboard-response__summary">
        <button
          type="button"
          className="company-dashboard-response__toggle"
          onClick={() => onToggle(item.id)}
          aria-expanded={isOpen}
          aria-controls={contentId}
        >
          <div className="company-dashboard-response__summary-top">
            <div className="company-dashboard-response__summary-copy">
              <div>
                <h3 className="ui-type-h3">{item.candidateName || "Кандидат без имени"}</h3>
                <p className="ui-type-caption company-dashboard-response__email">{item.candidateEmail || "Email не указан"}</p>
              </div>

              <p className="ui-type-body company-dashboard-response__opportunity">
                Отклик на: <strong>{item.opportunityTitle || "Возможность без названия"}</strong>
              </p>
            </div>

            <div className="company-dashboard-response__summary-meta">
              <Badge tone={item.status === "accepted" ? "success" : item.status === "invited" ? "warning" : "neutral"}>
                {translateApplicationStatus(item.status)}
              </Badge>
              <span className="company-dashboard-response__chevron" aria-hidden="true">
                <ChevronDownIcon />
              </span>
            </div>
          </div>

          {skills.length ? (
            <div className="company-dashboard-response__tags">
              {skills.map((skill) => (
                <Tag key={`${item.id}-${skill}`} className="company-dashboard-response__tag">
                  {skill}
                </Tag>
              ))}
            </div>
          ) : null}

          <p className="ui-type-body company-dashboard-response__description">
            {item.candidateDescription || "Описание профиля пока не добавлено."}
          </p>
        </button>

        <div className="company-dashboard-response__actions">
          <Button href={profileHref} variant="secondary" size="sm" className="company-dashboard-response__action">
            Профиль
          </Button>
          <Button href={resumeHref} variant="secondary" size="sm" className="company-dashboard-response__action">
            Резюме
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={isStartingChat}
            className="company-dashboard-response__action"
            onClick={() => onStartChat(item)}
          >
            Написать
          </Button>
        </div>
      </div>

      {isOpen ? (
        <div id={contentId} className="company-dashboard-response__expanded">
          {isAccepted ? (
            <div style={{ marginBottom: "16px" }}>
              <Alert tone="info" title="Отклик принят" showIcon>
                Этот отклик уже принят. Вы не можете изменить его статус напрямую. Для отмены отклика необходимо нажать кнопку ниже и подать жалобу/заявление в техподдержку с указанием причины.
              </Alert>
              {item.employerNote ? (
                <div style={{ marginTop: "12px", fontSize: "14px", color: "var(--ui-color-text-secondary)" }}>
                  <strong>Комментарий работодателя:</strong> {item.employerNote}
                </div>
              ) : null}
            </div>
          ) : isWithdrawn ? (
            <div style={{ marginBottom: "16px" }}>
              <Alert tone="neutral" title="Отклик отозван" showIcon>
                Кандидат отозвал этот отклик. Изменение статуса недоступно.
              </Alert>
            </div>
          ) : (
            <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two company-dashboard-response__editor-grid">
              <FormField label="Статус отклика" className="company-dashboard-response__field company-dashboard-response__field--status">
                <Select
                  value={edit.status}
                  onValueChange={(value) => onEditChange(item.id, "status", value)}
                  options={APPLICATION_STATUS_OPTIONS}
                  className="company-dashboard-response__control company-dashboard-response__control--select"
                />
              </FormField>

              <FormField label="Комментарий работодателя" className="company-dashboard-response__field">
                <Textarea
                  value={edit.employerNote}
                  onValueChange={(value) => onEditChange(item.id, "employerNote", value)}
                  rows={3}
                  autoResize
                  placeholder="Добавьте комментарий для кандидата"
                  className="company-dashboard-response__control company-dashboard-response__control--textarea"
                />
              </FormField>
            </div>
          )}

          <div className="company-dashboard-panel__actions company-dashboard-response__panel-actions">
            {isAccepted ? (
              <Button type="button" variant="secondary" onClick={() => onCancelAccepted(item)} className="candidate-application-card__action--warning">
                Отменить принятый отклик (подача жалобы)
              </Button>
            ) : isWithdrawn ? (
              null
            ) : (
              <Button type="button" onClick={() => onSave(item)} disabled={isSaving}>
                {isSaving ? "Сохраняем..." : "Обновить отклик"}
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </article>
  );
}

const CANCELLATION_REASONS = [
  { value: "Кандидат не выходит на связь / Не явился", label: "Кандидат не выходит на связь / Не явился" },
  { value: "Кандидат отказался от участия", label: "Кандидат отказался от участия" },
  { value: "Мероприятие отменено или перенесено", label: "Мероприятие отменено или перенесено" },
  { value: "Несоответствие требованиям (обнаружено позже)", label: "Несоответствие требованиям (обнаружено позже)" },
  { value: "Другая причина", label: "Другая причина" },
];

function CancelAcceptedResponseModal({ open, onClose, onSubmit, item, busy }) {
  const [reason, setReason] = useState(CANCELLATION_REASONS[0].value);
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ reason, description });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Отмена принятого отклика"
      description={`Вы отменяете ранее принятый отклик кандидата ${item?.candidateName || ""}. Это действие потребует подачи жалобы и уведомит кандидата о причине.`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="company-dashboard-stack">
        <FormField label="Причина отмены" required>
          <Select
            value={reason}
            onValueChange={setReason}
            options={CANCELLATION_REASONS}
          />
        </FormField>

        <FormField label="Подробности отмены (будут видны кандидату и техподдержке)">
          <Textarea
            value={description}
            onValueChange={setDescription}
            rows={4}
            autoResize
            placeholder="Укажите дополнительные детали отмены..."
          />
        </FormField>

        <div className="company-dashboard-panel__actions" style={{ justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Отмена
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Отправляем..." : "Подтвердить отмену отклика"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function CompanyResponsesSection() {
  const [state, setState] = useState({ status: "loading", applications: [], error: null });
  const [applicationEdits, setApplicationEdits] = useState({});
  const [busyApplicationId, setBusyApplicationId] = useState(0);
  const [chatBusyApplicationId, setChatBusyApplicationId] = useState(0);
  const [expandedApplicationId, setExpandedApplicationId] = useState(null);
  const [filters, setFilters] = useState({
    query: "",
    status: ALL_FILTER_VALUE,
    opportunity: ALL_FILTER_VALUE,
    sort: "newest",
  });
  const [saveState, setSaveState] = useState({ status: "idle", error: "" });
  const [cancelModalState, setCancelModalState] = useState({ open: false, item: null, busy: false });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const opportunities = await getCompanyOpportunities(controller.signal);
        const normalizedOpportunities = Array.isArray(opportunities) ? opportunities : [];
        const applications = await loadCompanyApplications(normalizedOpportunities, controller.signal);

        setState({ status: "ready", applications, error: null });
        setApplicationEdits(
          Object.fromEntries(
            applications.map((item) => [
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
          applications: [],
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const filterCounts = useMemo(
    () => state.applications.reduce((accumulator, item) => {
      const status = item?.status ?? "submitted";
      accumulator[status] = (accumulator[status] ?? 0) + 1;
      return accumulator;
    }, {}),
    [state.applications]
  );

  const opportunityOptions = useMemo(() => {
    const items = new Map();

    state.applications.forEach((item) => {
      const value = String(item?.opportunityId ?? item?.opportunityTitle ?? "").trim();
      if (!value || items.has(value)) {
        return;
      }

      items.set(value, item?.opportunityTitle || "Возможность без названия");
    });

    return [
      { value: ALL_FILTER_VALUE, label: "Все возможности" },
      ...Array.from(items, ([value, label]) => ({ value, label })).sort((left, right) => String(left.label).localeCompare(String(right.label), "ru")),
    ];
  }, [state.applications]);

  const filteredApplications = useMemo(() => {
    const query = normalizeSearchValue(filters.query);

    return [...state.applications]
      .filter((item) => {
        const matchesQuery = !query || [
          item.candidateName,
          item.candidateEmail,
          item.opportunityTitle,
        ].some((value) => normalizeSearchValue(value).includes(query));
        const matchesStatus = filters.status === ALL_FILTER_VALUE || item.status === filters.status;
        const opportunityValue = String(item?.opportunityId ?? item?.opportunityTitle ?? "").trim();
        const matchesOpportunity = filters.opportunity === ALL_FILTER_VALUE || opportunityValue === filters.opportunity;

        return matchesQuery && matchesStatus && matchesOpportunity;
      })
      .sort((left, right) => {
        switch (filters.sort) {
          case "oldest":
            return getApplicationDateValue(left) - getApplicationDateValue(right);
          case "status":
            return translateApplicationStatus(left.status).localeCompare(translateApplicationStatus(right.status), "ru");
          case "opportunity":
            return String(left.opportunityTitle ?? "").localeCompare(String(right.opportunityTitle ?? ""), "ru");
          case "newest":
          default:
            return getApplicationDateValue(right) - getApplicationDateValue(left);
        }
      });
  }, [filters, state.applications]);

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function resetFilters() {
    setFilters({
      query: "",
      status: ALL_FILTER_VALUE,
      opportunity: ALL_FILTER_VALUE,
      sort: "newest",
    });
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

  function handleApplicationToggle(applicationId) {
    setExpandedApplicationId((current) => (current === applicationId ? null : applicationId));
  }

  async function handleApplicationSave(item) {
    const edit = applicationEdits[item.id];
    if (!edit) {
      return;
    }

    setBusyApplicationId(item.id);
    setSaveState({ status: "saving", error: "" });

    try {
      const updatedApplication = await updateOpportunityApplicationStatus(item.opportunityId, item.id, {
        status: edit.status,
        employerNote: edit.employerNote || null,
      });

      setState((current) => ({
        ...current,
        applications: current.applications.map((currentItem) => (
          currentItem.id === item.id
            ? { ...currentItem, ...updatedApplication }
            : currentItem
        )),
      }));
      setBusyApplicationId(0);
      setSaveState({ status: "success", error: "" });
    } catch (error) {
      setBusyApplicationId(0);
      setSaveState({
        status: "error",
        error: error?.message ?? "Не удалось обновить статус отклика.",
      });
    }
  }

  function handleCancelAcceptedClick(item) {
    setCancelModalState({ open: true, item, busy: false });
  }

  async function handleCancelAcceptedSubmit({ reason, description }) {
    const item = cancelModalState.item;
    if (!item) return;

    setCancelModalState((current) => ({ ...current, busy: true }));

    try {
      const updatedApplication = await cancelAcceptedOpportunityApplication(item.opportunityId, item.id, {
        reason,
        description,
      });

      setState((current) => ({
        ...current,
        applications: current.applications.map((currentItem) => (
          currentItem.id === item.id
            ? { ...currentItem, ...updatedApplication }
            : currentItem
        )),
      }));

      setCancelModalState({ open: false, item: null, busy: false });
      setSaveState({ status: "success", error: "" });
    } catch (error) {
      setCancelModalState((current) => ({ ...current, busy: false }));
      setSaveState({
        status: "error",
        error: error?.message ?? "Не удалось отменить отклик.",
      });
    }
  }

  async function handleStartChat(item) {
    const recipientUserId = item?.candidateUserId ?? item?.applicantUserId;
    if (!recipientUserId || chatBusyApplicationId) {
      return;
    }

    try {
      setChatBusyApplicationId(item.id);
      const thread = await startChat({
        recipientUserId,
        contextType: "application",
        contextId: item.id,
        subject: item.opportunityTitle ? `Отклик: ${item.opportunityTitle}` : "Отклик кандидата",
      });
      window.location.href = `${routes.company.messages}?thread=${thread.id}`;
    } catch (error) {
      setSaveState({
        status: "error",
        error: error?.message ?? "Не удалось открыть чат с кандидатом.",
      });
    } finally {
      setChatBusyApplicationId(0);
    }
  }

  return (
    <>
      {state.status === "loading" ? <Loader label="Загружаем отклики компании" surface /> : null}

      {state.status === "unauthorized" ? (
        <CabinetContentSection eyebrow="Доступ ограничен" title="Нужно войти как компания" description="Отклики доступны только работодателю.">
          <EmptyState title="Нет доступа к откликам" description="После авторизации здесь появится очередь кандидатов." tone="warning" />
        </CabinetContentSection>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить отклики" showIcon>
          {state.error?.message ?? "Попробуйте обновить страницу позже."}
        </Alert>
      ) : null}

      {saveState.status === "error" ? (
        <Alert tone="error" title="Операция не выполнена" showIcon>
          {saveState.error}
        </Alert>
      ) : null}

      {saveState.status === "success" ? (
        <Alert tone="success" title="Отклик обновлён" showIcon>
          Статус и комментарий сохранены. Кандидат увидит обновления в своём кабинете.
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <CabinetContentSection eyebrow="Отклики" title="Отклики кандидатов" description="Основной список откликов компании с фильтром по статусу и раскрытием деталей по запросу.">
          {state.applications.length ? (
            <>
              <div className="company-dashboard-response-filters" role="toolbar" aria-label="Фильтр откликов">
                {APPLICATION_FILTER_OPTIONS.map((filter) => (
                  <FilterPill
                    key={filter.value}
                    label={filter.label}
                    count={filter.value === "all" ? state.applications.length : (filterCounts[filter.value] ?? 0)}
                    active={filters.status === filter.value}
                    onClick={() => updateFilter("status", filter.value)}
                    className="company-dashboard-response-filter"
                  />
                ))}
              </div>

              <div className="company-dashboard-responses-toolbar">
                <Input
                  value={filters.query}
                  onValueChange={(value) => updateFilter("query", value)}
                  placeholder="Поиск по кандидату, email или возможности"
                />
                <Select
                  value={filters.opportunity}
                  onValueChange={(value) => updateFilter("opportunity", value)}
                  options={opportunityOptions}
                />
                <Select
                  value={filters.sort}
                  onValueChange={(value) => updateFilter("sort", value)}
                  options={APPLICATION_SORT_OPTIONS}
                />
                <Button type="button" variant="ghost" onClick={resetFilters}>
                  Сбросить
                </Button>
              </div>

              <div className="company-dashboard-stack">
                {filteredApplications.map((item) => (
                  <CompanyApplicationCard
                    key={item.id}
                    item={item}
                    edit={applicationEdits[item.id] ?? { status: item.status, employerNote: item.employerNote ?? "" }}
                    isOpen={expandedApplicationId === item.id}
                    onToggle={handleApplicationToggle}
                    onEditChange={handleApplicationEditChange}
                    onSave={handleApplicationSave}
                    onStartChat={handleStartChat}
                    onCancelAccepted={handleCancelAcceptedClick}
                    busyId={busyApplicationId}
                    chatBusyId={chatBusyApplicationId}
                  />
                ))}
              </div>
              {filteredApplications.length ? null : (
                <EmptyState
                  title="Нет откликов в выбранном статусе"
                  description="Попробуйте изменить поиск, возможность или статус."
                  tone="neutral"
                  compact
                />
              )}
            </>
          ) : (
            <EmptyState title="Откликов пока нет" description="Когда кандидаты начнут откликаться на публикации, они появятся здесь." tone="neutral" compact />
          )}
        </CabinetContentSection>
      ) : null}

      <CancelAcceptedResponseModal
        open={cancelModalState.open}
        onClose={() => setCancelModalState({ open: false, item: null, busy: false })}
        onSubmit={handleCancelAcceptedSubmit}
        item={cancelModalState.item}
        busy={cancelModalState.busy}
      />
    </>
  );
}
