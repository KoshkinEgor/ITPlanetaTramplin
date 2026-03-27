import { useEffect, useMemo, useState } from "react";
import { getCandidateAchievements, getCandidateEducation, getCandidateProfile, getCandidateProjects } from "../api/candidate";
import { ApiError } from "../lib/http";
import { Alert, Button, Card, EmptyState, Loader } from "../shared/ui";
import { CANDIDATE_PAGE_ROUTES } from "./config";
import { formatLongDate, mapCandidateProjectToCard } from "./mappers";
import { getCandidateOnboardingData, getCandidateProfileLinks } from "./onboarding";
import {
  CandidatePortfolioProjectCard,
  CandidatePortfolioSwitcher,
  CandidateResumeMiniCard,
  CandidateResumeRecord,
  CandidateResumeSection,
} from "./portfolio-kit";
import { CandidateSectionHeader } from "./shared";

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getResumeExperienceLabel(source) {
  const experience = isRecord(source?.experience) ? source.experience : {};

  if (experience.noExperience || (!experience.company && !experience.role && !experience.period)) {
    return "Опыт: не указан";
  }

  if (normalizeString(experience.period)) {
    return `Опыт: ${normalizeString(experience.period)}`;
  }

  if (normalizeString(experience.role)) {
    return `Опыт: ${normalizeString(experience.role)}`;
  }

  return "Опыт: указан";
}

function getResumeVisibility(profile) {
  const preferences = isRecord(profile?.preferences) ? profile.preferences : {};
  const visibility = isRecord(preferences.visibility) ? preferences.visibility : {};
  const profileVisibility = normalizeString(visibility.profileVisibility);

  return profileVisibility === "employers" || profileVisibility === "employers-and-contacts" ? "employers" : "private";
}

function buildResumeStats(stats) {
  const source = isRecord(stats) ? stats : {};

  return {
    impressions: Number.isFinite(Number(source.impressions)) ? Number(source.impressions) : 0,
    views: Number.isFinite(Number(source.views)) ? Number(source.views) : 0,
    invitations: Number.isFinite(Number(source.invitations)) ? Number(source.invitations) : 0,
  };
}

function buildFallbackResume(profile) {
  const onboarding = getCandidateOnboardingData(profile);

  return {
    id: "resume-primary",
    title: normalizeString(onboarding.profession) || "Резюме кандидата",
    updatedAt: onboarding.completedAt ?? null,
    city: normalizeString(onboarding.city) || "Город не указан",
    experience: getResumeExperienceLabel(onboarding),
    visibility: getResumeVisibility(profile),
    stats: buildResumeStats(),
  };
}

function buildCandidateResumeItems(profile) {
  const fallbackResume = buildFallbackResume(profile);
  const profileLinks = getCandidateProfileLinks(profile);
  const resumes = Array.isArray(profileLinks.resumes) ? profileLinks.resumes.filter(isRecord) : [];

  if (!resumes.length) {
    return [fallbackResume];
  }

  return resumes.map((resume, index) => {
    const experienceSource = isRecord(resume.experience) ? { experience: resume.experience } : resume;
    const experienceLabel = normalizeString(resume.experienceLabel) || (typeof resume.experience === "string" ? normalizeString(resume.experience) : "");
    const visibility = normalizeString(resume.visibility);

    return {
      id: normalizeString(resume.id) || `resume-${index + 1}`,
      title: normalizeString(resume.title) || normalizeString(resume.profession) || normalizeString(resume.position) || fallbackResume.title,
      updatedAt: resume.updatedAt ?? resume.updatedDate ?? resume.lastModifiedAt ?? fallbackResume.updatedAt,
      city: normalizeString(resume.city) || fallbackResume.city,
      experience: experienceLabel || getResumeExperienceLabel(experienceSource) || fallbackResume.experience,
      visibility: visibility === "employers" ? "employers" : fallbackResume.visibility,
      stats: buildResumeStats(resume.stats),
    };
  });
}

export function CandidateResumeApp() {
  const [state, setState] = useState({
    status: "loading",
    profile: null,
    education: [],
    achievements: [],
    error: null,
  });
  const [deletedResumeIds, setDeletedResumeIds] = useState([]);
  const [resumeVisibilityById, setResumeVisibilityById] = useState({});

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

  useEffect(() => {
    setDeletedResumeIds([]);
    setResumeVisibilityById({});
  }, [state.profile]);

  const resumeGoal = useMemo(() => normalizeString(getCandidateOnboardingData(state.profile).goal), [state.profile]);
  const resumeItems = useMemo(() => buildCandidateResumeItems(state.profile), [state.profile]);
  const visibleResumeItems = useMemo(
    () =>
      resumeItems
        .filter((item) => !deletedResumeIds.includes(item.id))
        .map((item) => ({
          ...item,
          visibility: resumeVisibilityById[item.id] ?? item.visibility,
        })),
    [deletedResumeIds, resumeItems, resumeVisibilityById]
  );

  return (
    <>
      <CandidatePortfolioSwitcher value="resume" />

      {state.status === "loading" ? <Loader label="Загружаем резюме" surface /> : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Доступ ограничен"
            title="Нужно войти как кандидат"
            description="Резюме собирается из данных профиля, образования и достижений авторизованного кандидата."
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
          <section className="candidate-page-section candidate-resume-overview">
            {resumeGoal ? (
              <Card className="candidate-resume-goal-card">
                <span className="candidate-resume-goal-card__label">Ваша цель</span>
                <p className="candidate-resume-goal-card__value">{resumeGoal}</p>
              </Card>
            ) : null}

            <CandidateSectionHeader
              eyebrow="Резюме"
              title="Мое резюме"
              description="Собери свой портфолио и резюме для точных рекомендаций."
              actions={<Button href={CANDIDATE_PAGE_ROUTES.resumeEditor}>Создать резюме</Button>}
            />

            {visibleResumeItems.length ? (
              <div className="candidate-page-stack">
                {visibleResumeItems.map((item) => (
                  <CandidateResumeMiniCard
                    key={item.id}
                    title={item.title}
                    updatedAt={item.updatedAt}
                    city={item.city}
                    experience={item.experience}
                    stats={item.stats}
                    visibility={item.visibility}
                    editHref={CANDIDATE_PAGE_ROUTES.resumeEditor}
                    menuLabel="Открыть действия резюме"
                    onDeleteClick={() => {
                      setDeletedResumeIds((current) => (current.includes(item.id) ? current : current.concat(item.id)));
                    }}
                    onVisibilityChange={(nextVisibility) => {
                      setResumeVisibilityById((current) => ({
                        ...current,
                        [item.id]: nextVisibility,
                      }));
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card className="candidate-resume-panel">
                <EmptyState
                  title="Карточка резюме пока не собрана"
                  description="Добавьте первое резюме, чтобы его можно было показывать работодателям отдельно от профиля."
                  tone="neutral"
                  actions={<Button href={CANDIDATE_PAGE_ROUTES.resumeEditor}>Создать резюме</Button>}
                />
              </Card>
            )}
          </section>

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
