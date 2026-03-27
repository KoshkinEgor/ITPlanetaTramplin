import { useEffect, useMemo, useState } from "react";
import { getCandidateAchievements, getCandidateEducation, getCandidateProfile, getCandidateProjects } from "../api/candidate";
import { ApiError } from "../lib/http";
import { Alert, Button, Card, EmptyState, Loader } from "../shared/ui";
import { CANDIDATE_PAGE_ROUTES } from "./config";
import { formatLongDate, getCandidateSkills, mapCandidateProjectToCard } from "./mappers";
import {
  CandidatePortfolioProjectCard,
  CandidatePortfolioSwitcher,
  CandidateResumeProfileCard,
  CandidateResumeRecord,
  CandidateResumeSection,
} from "./portfolio-kit";
import { CandidateSectionHeader } from "./shared";

export function CandidateResumeApp() {
  const [state, setState] = useState({
    status: "loading",
    profile: null,
    education: [],
    achievements: [],
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [profile, education, achievements] = await Promise.all([
          getCandidateProfile(controller.signal),
          getCandidateEducation(controller.signal),
          getCandidateAchievements(controller.signal),
        ]);

        setState({
          status: "ready",
          profile,
          education: Array.isArray(education) ? education : [],
          achievements: Array.isArray(achievements) ? achievements : [],
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          profile: null,
          education: [],
          achievements: [],
          error,
        });
      }
    }

    load();

    return () => controller.abort();
  }, []);

  return (
    <>
      <CandidatePortfolioSwitcher value="resume" />

      {state.status === "loading" ? <Loader label="Загружаем резюме" surface /> : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Доступ ограничен"
            title="Нужно войти как кандидат"
            description="Резюме теперь собирается из реальных данных профиля, образования и достижений."
            tone="warning"
          />
        </Card>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить резюме" showIcon>
          {state.error?.message ?? "Попробуйте обновить страницу позже."}
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <>
          <CandidateResumeProfileCard
            description={state.profile?.description || "Описание профиля пока пустое."}
            skills={getCandidateSkills(state.profile)}
          />

          <CandidateResumeSection
            title="Образование"
            emptyText="Образование еще не добавлено"
            items={state.education}
            renderItem={(item) => (
              <CandidateResumeRecord
                key={item.id}
                title={item.institutionName}
                description={[item.faculty, item.specialization].filter(Boolean).join(" · ")}
                meta={`${item.startYear || "?"} - ${item.graduationYear || "?"}`}
              />
            )}
          />

          <CandidateResumeSection
            title="Достижения"
            emptyText="Достижения еще не добавлены"
            items={state.achievements}
            renderItem={(item) => (
              <CandidateResumeRecord
                key={item.id}
                title={item.title || "Достижение"}
                description={item.description || "Без описания"}
                meta={formatLongDate(item.obtainDate) || "Дата не указана"}
              />
            )}
          />
        </>
      ) : null}
    </>
  );
}

export function CandidateProjectsApp() {
  const [state, setState] = useState({
    status: "loading",
    projects: [],
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const projects = await getCandidateProjects(controller.signal);

        setState({
          status: "ready",
          projects: Array.isArray(projects) ? projects : [],
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          projects: [],
          error,
        });
      }
    }

    load();

    return () => controller.abort();
  }, []);

  const projectItems = useMemo(() => state.projects.map(mapCandidateProjectToCard), [state.projects]);

  return (
    <>
      <CandidatePortfolioSwitcher value="projects" />

      {state.status === "loading" ? <Loader label="Загружаем проекты" surface /> : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Доступ ограничен"
            title="Нужно войти как кандидат"
            description="Портфолио доступно только авторизованному кандидату."
            tone="warning"
          />
        </Card>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить проекты" showIcon>
          {state.error?.message ?? "Попробуйте повторить позже."}
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <section className="candidate-page-section">
          <CandidateSectionHeader
            title="Портфолио"
            description="Выложи кейсы, которые могут показать твои текущие навыки."
            actions={<Button href={CANDIDATE_PAGE_ROUTES.projectEditor}>Добавить проект</Button>}
          />

          {projectItems.length ? (
            <div className="candidate-page-grid candidate-page-grid--two">
              {projectItems.map((item) => (
                <CandidatePortfolioProjectCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                eyebrow="Пока пусто"
                title="Проекты еще не добавлены"
                description="Добавьте первый кейс через редактор, и он сразу появится здесь."
                tone="neutral"
                actions={<Button href={CANDIDATE_PAGE_ROUTES.projectEditor}>Добавить проект</Button>}
              />
            </Card>
          )}
        </section>
      ) : null}
    </>
  );
}
