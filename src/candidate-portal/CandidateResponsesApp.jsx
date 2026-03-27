import { useMemo, useState } from "react";
import { confirmCandidateApplication, withdrawCandidateApplication } from "../api/candidate";
import { CandidateApplicationCard } from "./CandidateApplicationCard";
import { useCandidateApplications, upsertCandidateApplication } from "./candidate-applications-store";
import { Alert, Card, EmptyState, Loader } from "../shared/ui";
import { RESPONSE_FILTERS } from "./config";
import { mapCandidateApplicationToCard } from "./mappers";
import { CandidateFilterPill, CandidateSectionHeader, CandidateSortButton } from "./shared";

export function CandidateResponsesApp() {
  const applicationsState = useCandidateApplications();
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingAction, setPendingAction] = useState({ applicationId: null, kind: null, error: "" });

  const filteredItems = useMemo(() => {
    const applications = Array.isArray(applicationsState.applications) ? applicationsState.applications : [];

    if (statusFilter === "all") {
      return applications.map(mapCandidateApplicationToCard);
    }

    return applications
      .filter((item) => item.status === statusFilter)
      .map(mapCandidateApplicationToCard);
  }, [applicationsState.applications, statusFilter]);

  async function handleWithdraw(item) {
    setPendingAction({ applicationId: item.id, kind: "withdraw", error: "" });

    try {
      const updatedApplication = await withdrawCandidateApplication(item.id);
      upsertCandidateApplication(updatedApplication);
      setPendingAction({ applicationId: null, kind: null, error: "" });
    } catch (error) {
      setPendingAction({
        applicationId: null,
        kind: null,
        error: error?.message ?? "Не удалось отменить отклик.",
      });
    }
  }

  async function handleConfirm(item) {
    setPendingAction({ applicationId: item.id, kind: "confirm", error: "" });

    try {
      const updatedApplication = await confirmCandidateApplication(item.id);
      upsertCandidateApplication(updatedApplication);
      setPendingAction({ applicationId: null, kind: null, error: "" });
    } catch (error) {
      setPendingAction({
        applicationId: null,
        kind: null,
        error: error?.message ?? "Не удалось подтвердить участие.",
      });
    }
  }

  return (
    <section className="candidate-page-section">
      <CandidateSectionHeader
        eyebrow="Отклики"
        title="Мои отклики"
        description="Собери свой портфолио и резюме для точных рекомендаций."
      />

      {pendingAction.error ? (
        <Alert tone="error" title="Не удалось обновить отклик" showIcon>
          {pendingAction.error}
        </Alert>
      ) : null}

      {applicationsState.status === "loading" && applicationsState.applications.length === 0 ? (
        <Loader label="Загружаем отклики" surface />
      ) : null}

      {applicationsState.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Доступ ограничен"
            title="Нужно войти как кандидат"
            description="Отклики доступны только после авторизации кандидата."
            tone="warning"
          />
        </Card>
      ) : null}

      {applicationsState.status === "error" && applicationsState.applications.length === 0 ? (
        <Alert tone="error" title="Не удалось загрузить отклики" showIcon>
          {applicationsState.error?.message ?? "Попробуйте повторить позже."}
        </Alert>
      ) : null}

      {applicationsState.status === "ready" || applicationsState.applications.length ? (
        <>
          <div className="candidate-filter-row">
            <div className="candidate-filter-row__group">
              {RESPONSE_FILTERS.map((filter) => (
                <CandidateFilterPill
                  key={filter.value}
                  label={filter.label}
                  active={filter.value === statusFilter}
                  onClick={() => setStatusFilter(filter.value)}
                />
              ))}
            </div>
            <CandidateSortButton label="Требуют внимания" />
          </div>

          {filteredItems.length ? (
            <div className="candidate-page-stack">
              {filteredItems.map((item) => (
                <CandidateApplicationCard
                  key={item.id}
                  item={item}
                  isPending={pendingAction.applicationId === item.id}
                  onWithdraw={handleWithdraw}
                  onConfirm={handleConfirm}
                />
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                eyebrow="Пока пусто"
                title="Нет откликов в выбранном статусе"
                description="Список появится после откликов на опубликованные и одобренные возможности."
                tone="neutral"
              />
            </Card>
          )}
        </>
      ) : null}
    </section>
  );
}
