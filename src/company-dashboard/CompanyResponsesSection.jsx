import { useEffect, useMemo, useState } from "react";
import { getCompanyOpportunities, updateOpportunityApplicationStatus } from "../api/company";
import { ApiError } from "../lib/http";
import { Alert, Badge, Button, EmptyState, FormField, Loader, ResponseCard, Select, Textarea } from "../shared/ui";
import { CabinetContentSection } from "../widgets/layout";
import { loadCompanyApplications, mapApplicationTone, translateApplicationStatus } from "./utils";
import "./company-dashboard.css";

const APPLICATION_STATUS_OPTIONS = [
  { value: "submitted", label: "Отправлено" },
  { value: "reviewing", label: "На рассмотрении" },
  { value: "invited", label: "Приглашение" },
  { value: "accepted", label: "Принято" },
  { value: "rejected", label: "Отказ" },
  { value: "withdrawn", label: "Отозвано" },
];

function CompanyApplicationCard({ item, edit, onEditChange, onSave, busyId }) {
  const isSaving = busyId === item.id;

  return (
    <article className="company-dashboard-response">
      <div className="company-dashboard-stack">
        <div className="company-dashboard-list-item__top">
          <div>
            <h3 className="ui-type-h3">{item.candidateName || "Кандидат без имени"}</h3>
            <p className="ui-type-caption">{item.candidateEmail}</p>
          </div>
          <Badge tone={item.status === "accepted" ? "success" : item.status === "invited" ? "warning" : "neutral"}>
            {translateApplicationStatus(item.status)}
          </Badge>
        </div>

        <p className="ui-type-body">{item.candidateDescription || "Описание профиля пока не добавлено."}</p>
        <p className="ui-type-caption">Отклик на: {item.opportunityTitle}</p>

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

        <div className="company-dashboard-panel__actions">
          <Button type="button" onClick={() => onSave(item)} disabled={isSaving}>
            {isSaving ? "Сохраняем..." : "Обновить отклик"}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function CompanyResponsesSection() {
  const [state, setState] = useState({ status: "loading", applications: [], error: null });
  const [applicationEdits, setApplicationEdits] = useState({});
  const [busyApplicationId, setBusyApplicationId] = useState(0);
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
  }, [saveState.status]);

  const recentItems = useMemo(() => state.applications.slice(0, 3), [state.applications]);

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
    if (!edit) {
      return;
    }

    setBusyApplicationId(item.id);
    setSaveState({ status: "saving", error: "" });

    try {
      await updateOpportunityApplicationStatus(item.opportunityId, item.id, {
        status: edit.status,
        employerNote: edit.employerNote || null,
      });

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
        <Alert tone="success" title="Отклик обновлен" showIcon>
          Статус и комментарий сохранены. Кандидат увидит обновления в своем кабинете.
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <>
          <CabinetContentSection eyebrow="Отклики" title="Отклики кандидатов" description="Основной поток откликов компании с управлением статусом и комментарием.">
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
              <EmptyState title="Откликов пока нет" description="Когда кандидаты начнут откликаться на публикации, они появятся здесь." tone="neutral" compact />
            )}
          </CabinetContentSection>

          <CabinetContentSection eyebrow="Сводка" title="Последние отклики" description="Быстрый обзор последних кандидатов, чтобы вы ничего не упустили.">
            {recentItems.length ? (
              <div className="company-dashboard-stack">
                {recentItems.map((item) => (
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
              <EmptyState title="Нет новых откликов" description="Сводка заполнится автоматически после первых откликов." tone="neutral" compact />
            )}
          </CabinetContentSection>
        </>
      ) : null}
    </>
  );
}
