import { useEffect, useMemo, useState } from "react";
import { buildCandidatePublicProfileRoute } from "../app/routes";
import { getCompanyOpportunities, updateOpportunityApplicationStatus } from "../api/company";
import { cn } from "../lib/cn";
import { ApiError } from "../lib/http";
import { Alert, Badge, Button, EmptyState, FilterPill, FormField, Loader, Select, Tag, Textarea } from "../shared/ui";
import { CabinetContentSection } from "../widgets/layout";
import { loadCompanyApplications, translateApplicationStatus } from "./utils";
import "./company-dashboard.css";

const APPLICATION_STATUS_OPTIONS = [
  { value: "submitted", label: "Отправлено" },
  { value: "reviewing", label: "На рассмотрении" },
  { value: "invited", label: "Приглашение" },
  { value: "accepted", label: "Принято" },
  { value: "rejected", label: "Отказ" },
  { value: "withdrawn", label: "Отозвано" },
];

const APPLICATION_FILTER_OPTIONS = [
  { value: "all", label: "Все" },
  ...APPLICATION_STATUS_OPTIONS,
];

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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

function CompanyApplicationCard({ item, edit, isOpen, onToggle, onEditChange, onSave, busyId }) {
  const isSaving = busyId === item.id;
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
        </div>
      </div>

      {isOpen ? (
        <div id={contentId} className="company-dashboard-response__expanded">
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

          <div className="company-dashboard-panel__actions company-dashboard-response__panel-actions">
            <Button type="button" onClick={() => onSave(item)} disabled={isSaving}>
              {isSaving ? "Сохраняем..." : "Обновить отклик"}
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function CompanyResponsesSection() {
  const [state, setState] = useState({ status: "loading", applications: [], error: null });
  const [applicationEdits, setApplicationEdits] = useState({});
  const [busyApplicationId, setBusyApplicationId] = useState(0);
  const [expandedApplicationId, setExpandedApplicationId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [saveState, setSaveState] = useState({ status: "idle", error: "" });

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

  const filteredApplications = useMemo(() => {
    if (statusFilter === "all") {
      return state.applications;
    }

    return state.applications.filter((item) => item.status === statusFilter);
  }, [state.applications, statusFilter]);

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
                    active={statusFilter === filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className="company-dashboard-response-filter"
                  />
                ))}
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
                    busyId={busyApplicationId}
                  />
                ))}
              </div>
              {filteredApplications.length ? null : (
                <EmptyState
                  title="Нет откликов в выбранном статусе"
                  description="Попробуйте другой фильтр или дождитесь обновлений по кандидатам."
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
    </>
  );
}
