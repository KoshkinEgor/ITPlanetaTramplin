import { useEffect, useMemo, useState } from "react";
import { getCandidateApplications } from "../api/candidate";
import { ApiError } from "../lib/http";
import { Alert, Card, EmptyState, Loader } from "../shared/ui";
import { RESPONSE_FILTERS } from "./config";
import { mapCandidateApplicationToCard } from "./mappers";
import { CandidateFilterPill, CandidateResponseCard, CandidateSectionHeader, CandidateSortButton } from "./shared";

export function CandidateResponsesApp() {
  const [state, setState] = useState({ status: "loading", applications: [], error: null });
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const applications = await getCandidateApplications(controller.signal);

        setState({
          status: "ready",
          applications: Array.isArray(applications) ? applications : [],
          error: null,
        });
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

  const filteredItems = useMemo(() => {
    if (statusFilter === "all") {
      return state.applications.map(mapCandidateApplicationToCard);
    }

    return state.applications
      .filter((item) => item.status === statusFilter)
      .map(mapCandidateApplicationToCard);
  }, [state.applications, statusFilter]);

  return (
    <section className="candidate-page-section">
      <CandidateSectionHeader eyebrow="Отклики" title="Мои отклики" description="Собери свой портфолио и резюме для точных рекомендаций." />

      {state.status === "loading" ? <Loader label="Загружаем отклики" surface /> : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Доступ ограничен"
            title="Нужно войти как кандидат"
            description="Отклики доступны только после авторизации кандидата."
            tone="warning"
          />
        </Card>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить отклики" showIcon>
          {state.error?.message ?? "Попробуйте повторить позже."}
        </Alert>
      ) : null}

      {state.status === "ready" ? (
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
                <CandidateResponseCard key={item.id} item={item} />
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
