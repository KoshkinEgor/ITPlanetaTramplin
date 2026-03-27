import { useEffect, useMemo, useState } from "react";
/* eslint-disable no-irregular-whitespace */
import { getCandidateAchievements, getCandidateEducation, getCandidateProfile, getCandidateProjects } from "../api/candidate";
import { ApiError } from "../lib/http";
import { Alert, Button, Card, EmptyState, Loader, Tag } from "../shared/ui";
import { CANDIDATE_PAGE_ROUTES, CANDIDATE_PORTFOLIO_TABS } from "./config";
import { formatLongDate, getCandidateSkills, mapCandidateProjectToCard } from "./mappers";
import { CandidateProjectCard, CandidateSectionHeader, CandidateSegmentNav } from "./shared";

function CandidatePortfolioSwitcher({ value }) {
  return (
    <Card className="candidate-switcher-card">
      <CandidateSectionHeader title="Резюме и портфолио" />
      <CandidateSegmentNav items={CANDIDATE_PORTFOLIO_TABS} value={value} />
    </Card>
  );
}

function ResumeSection({ title, emptyText, items, renderItem }) {
  return (
    <Card className="candidate-resume-panel">
      <div className="candidate-resume-panel__intro">
        <h2 className="ui-type-h2">{title}</h2>
      </div>

      {items.length ? (
        <div className="candidate-page-stack">
          {items.map(renderItem)}
        </div>
      ) : (
        <EmptyState title={emptyText} description="Раздел заполнится после реальных действий кандидата." compact tone="neutral" />
      )}
    </Card>
  );
}

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
          <Card className="candidate-resume-panel">
            <div className="candidate-resume-panel__intro">
              <Tag tone="accent">Резюме</Tag>
              <h2 className="ui-type-h2">Профиль кандидата</h2>
              <p className="ui-type-body">{state.profile?.description || "Описание профиля пока пустое."}</p>
            </div>

            <div className="candidate-resume-record__tags">
              {getCandidateSkills(state.profile).length ? (
                getCandidateSkills(state.profile).map((skill) => (
                  <Tag key={skill}>{skill}</Tag>
                ))
              ) : (
                <Tag>Навыки пока не указаны</Tag>
              )}
            </div>

            <div className="candidate-resume-panel__actions">
              <Button href={CANDIDATE_PAGE_ROUTES.resumeEditor}>Редактировать данные</Button>
            </div>
          </Card>

          <ResumeSection
            title="Образование"
            emptyText="Образование еще не добавлено"
            items={state.education}
            renderItem={(item) => (
              <article key={item.id} className="candidate-resume-record">
                <div className="candidate-resume-record__head">
                  <div className="candidate-resume-record__copy-link">
                    <h3 className="ui-type-h2">{item.institutionName}</h3>
                    <p className="ui-type-body">
                      {[item.faculty, item.specialization].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
                <div className="candidate-resume-record__stats">
                  <span>{item.startYear || "?"} - {item.graduationYear || "?"}</span>
                </div>
              </article>
            )}
          />

          <ResumeSection
            title="Достижения"
            emptyText="Достижения еще не добавлены"
            items={state.achievements}
            renderItem={(item) => (
              <article key={item.id} className="candidate-resume-record">
                <div className="candidate-resume-record__head">
                  <div className="candidate-resume-record__copy-link">
                    <h3 className="ui-type-h2">{item.title || "Достижение"}</h3>
                    <p className="ui-type-body">{item.description || "Без описания"}</p>
                  </div>
                </div>
                <div className="candidate-resume-record__stats">
                  <span>{formatLongDate(item.obtainDate) || "Дата не указана"}</span>
                </div>
              </article>
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
                <CandidateProjectCard key={item.id} item={item} />
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
