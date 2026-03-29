import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { PUBLIC_HEADER_NAV_ITEMS, buildAuthLoginRoute, routes } from "../../app/routes";
import {
  createCandidateEducation,
  deleteCandidateEducation,
  getCandidateApplications,
  getCandidateContacts,
  getCandidateEducation,
  getCandidateProfile,
  getCandidateRecommendations,
  updateCandidateEducation,
  updateCandidateProfile,
} from "../../api/candidate";
import { searchYandexCityOptions } from "../../api/cities";
import { getOpportunities } from "../../api/opportunities";
import {
  createCandidateEducationDraft,
  createEducationDraftListAfterRemove,
  getActiveCandidateEducationDrafts,
  getCandidateEducationDraftErrors,
} from "../../candidate-portal/education";
import {
  CandidateExperienceListEditor,
  CandidateProfessionSelector,
  CandidateProfileGateModal,
} from "../../candidate-portal/onboarding-widgets";
import {
  buildCandidateOnboardingLinks,
  CANDIDATE_CITIZENSHIP_OPTIONS,
  CANDIDATE_GENDER_OPTIONS,
  CANDIDATE_ONBOARDING_STEPS,
  CANDIDATE_SKILL_OPTIONS,
  createCandidateOnboardingDraft,
  createCandidateExperienceDraft,
  createExperienceDraftListAfterRemove,
  getCandidateMandatoryCompletion,
  getCandidateOnboardingProgress,
  getCandidateOnboardingStepError,
} from "../../candidate-portal/onboarding";
import { PortalHeader } from "../../widgets/layout";
import {
  Alert,
  Button,
  Card,
  CityAutocomplete,
  EducationListEditor,
  FormField,
  Input,
  Loader,
  Modal,
  SearchInput,
  Select,
  Tag,
  Textarea,
} from "../../shared/ui";
import { scheduleHashScroll } from "../../shared/lib/scrollToHashTarget";
import { CandidateCareerDashboard } from "./CandidateCareerDashboard";
import { loadCandidateCareerContext } from "./candidate-access";
import "./candidate-career.css";

const headerNav = PUBLIC_HEADER_NAV_ITEMS;
const candidateLoginHref = buildAuthLoginRoute({ role: "candidate" });

function normalizeSearchValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4 12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 4 4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function getFirstIncompleteStepIndex(draft) {
  const nextIndex = CANDIDATE_ONBOARDING_STEPS.findIndex((step) => getCandidateOnboardingStepError(step.key, draft));
  return nextIndex >= 0 ? nextIndex : CANDIDATE_ONBOARDING_STEPS.length - 1;
}

function StepProgress({ activeIndex }) {
  return (
    <div className="candidate-career-progress" aria-label="Прогресс заполнения профиля">
      {CANDIDATE_ONBOARDING_STEPS.map((step, index) => (
        <span
          key={step.key}
          className={`candidate-career-progress__segment ${index <= activeIndex ? "is-complete" : ""}`.trim()}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function ProfessionStep({ draft, onProfessionChange, onAdditionalProfessionsChange }) {
  return (
    <div className="candidate-career-step">
      <div className="candidate-career-step__head">
        <h2>Выберите профессию</h2>
        <p>Основная профессия используется для карьерных рекомендаций. Дополнительные направления помогут точнее подобрать возможности.</p>
      </div>

      <CandidateProfessionSelector
        profession={draft.profession}
        additionalProfessions={draft.additionalProfessions}
        onProfessionChange={onProfessionChange}
        onAdditionalProfessionsChange={onAdditionalProfessionsChange}
      />
    </div>
  );
}

function BasicsStep({ draft, onFieldChange }) {
  return (
    <div className="candidate-career-step">
      <div className="candidate-career-step__head">
        <h2>Заполните основную информацию</h2>
        <p>Эти данные сохраняются в профиль и помогают сервису подобрать релевантные рекомендации и отклики.</p>
      </div>

      <div className="candidate-career-grid candidate-career-grid--two">
        <FormField label="Фамилия" required>
          <Input value={draft.surname} onValueChange={(value) => onFieldChange("surname", value)} placeholder="Иванова" />
        </FormField>
        <FormField label="Имя" required>
          <Input value={draft.name} onValueChange={(value) => onFieldChange("name", value)} placeholder="Анна" />
        </FormField>
      </div>

      <FormField label="Отчество">
        <Input value={draft.thirdname} onValueChange={(value) => onFieldChange("thirdname", value)} placeholder="Сергеевна" />
      </FormField>

      <div className="candidate-career-grid candidate-career-grid--two">
        <FormField label="Пол" required>
          <Select value={draft.gender} onValueChange={(value) => onFieldChange("gender", value)} placeholder="Выберите пол" options={CANDIDATE_GENDER_OPTIONS} />
        </FormField>
        <FormField label="Дата рождения" required>
          <Input type="date" value={draft.birthDate} onValueChange={(value) => onFieldChange("birthDate", value)} />
        </FormField>
      </div>

      <FormField label="Телефон" required>
        <Input value={draft.phone} onValueChange={(value) => onFieldChange("phone", value)} placeholder="+7 999 000 00 00" />
      </FormField>

      <div className="candidate-career-grid candidate-career-grid--two">
        <FormField label="Город" required>
          <CityAutocomplete
            value={draft.city}
            onValueChange={(value) => onFieldChange("city", value)}
            searchOptions={searchYandexCityOptions}
            placeholder="Выбранный город"
            searchPlaceholder="Начните вводить город"
            loadingLabel="Ищем города через Яндекс…"
            errorLabel="Подсказки Яндекса временно недоступны. Можно ввести город вручную."
          />
        </FormField>
        <FormField label="Гражданство" required>
          <Select
            value={draft.citizenship}
            onValueChange={(value) => onFieldChange("citizenship", value)}
            placeholder="Выберите гражданство"
            options={CANDIDATE_CITIZENSHIP_OPTIONS.map((value) => ({ value, label: value }))}
          />
        </FormField>
      </div>
    </div>
  );
}

function EducationStep({ draft, educationErrors, onEducationFieldChange, onEducationAdd, onEducationRemove }) {
  return (
    <div className="candidate-career-step">
      <div className="candidate-career-step__head">
        <h2>Образование</h2>
        <p>Добавьте одно или несколько мест обучения. Они сразу попадут в профиль кандидата.</p>
      </div>

      <EducationListEditor
        items={draft.educations}
        errorsByKey={educationErrors}
        onItemChange={onEducationFieldChange}
        onAddItem={onEducationAdd}
        onRemoveItem={onEducationRemove}
      />
    </div>
  );
}

function SkillsStep({ draft, skillQuery, onSkillQueryChange, onAddSkill, onRemoveSkill }) {
  const filteredSkills = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(skillQuery);
    return CANDIDATE_SKILL_OPTIONS.filter((option) => !draft.skills.includes(option) && (!normalizedQuery || normalizeSearchValue(option).includes(normalizedQuery)));
  }, [draft.skills, skillQuery]);

  return (
    <div className="candidate-career-step">
      <div className="candidate-career-step__head">
        <h2>Ключевые навыки</h2>
        <p>Навыки используются в рекомендациях, фильтрах и при сопоставлении с возможностями.</p>
      </div>

      <SearchInput
        value={skillQuery}
        onValueChange={onSkillQueryChange}
        placeholder="Поиск навыков"
        width="full"
        className="candidate-career-search"
        clearLabel="Очистить поиск навыков"
      />

      <div className="candidate-career-chip-cloud candidate-career-chip-cloud--selected">
        {draft.skills.length ? draft.skills.map((skill) => (
          <button key={skill} type="button" className="candidate-career-chip candidate-career-chip--selected" onClick={() => onRemoveSkill(skill)}>
            <span>{skill}</span>
            <CloseIcon />
          </button>
        )) : <p className="candidate-career-empty">Пока не выбран ни один навык.</p>}
      </div>

      <div className="candidate-career-recommendations">
        <span>Рекомендованные навыки</span>
        <div className="candidate-career-chip-cloud">
          {filteredSkills.map((skill) => (
            <button key={skill} type="button" className="candidate-career-chip" onClick={() => onAddSkill(skill)}>
              {skill}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExperienceStep({ draft, onNoExperienceChange, onExperienceChange, onExperienceAdd, onExperienceRemove }) {
  return (
    <div className="candidate-career-step">
      <div className="candidate-career-step__head">
        <h2>Опыт работы</h2>
        <p>Можно добавить несколько мест работы подряд или отметить, что опыта пока нет.</p>
      </div>

      <CandidateExperienceListEditor
        experiences={draft.experiences}
        noExperience={draft.noExperience}
        onNoExperienceChange={onNoExperienceChange}
        onExperienceChange={onExperienceChange}
        onExperienceAdd={onExperienceAdd}
        onExperienceRemove={onExperienceRemove}
      />
    </div>
  );
}

function GoalStep({ draft, onFieldChange }) {
  return (
    <div className="candidate-career-step">
      <div className="candidate-career-step__head">
        <h2>Карьерная цель</h2>
        <p>Расскажите, чего хотите достичь в ближайшее время: стажировка, первая работа, смена направления или рост роли.</p>
      </div>

      <FormField label="Цель" required>
        <Textarea
          value={draft.goal}
          onValueChange={(value) => onFieldChange("goal", value)}
          rows={5}
          autoResize
          placeholder="Например: пройти стажировку на позицию frontend-разработчика и собрать сильное портфолио."
        />
      </FormField>
    </div>
  );
}

async function syncCandidateEducation(profileEducation, draftEducations) {
  const activeEducationItems = getActiveCandidateEducationDrafts(draftEducations);
  const currentEducationItems = safeArray(profileEducation);
  const activeEducationIds = new Set(activeEducationItems.map((item) => item.id).filter(Boolean));

  for (const item of activeEducationItems) {
    const payload = {
      institutionName: item.institutionName.trim(),
      faculty: item.faculty.trim() || null,
      specialization: item.specialization.trim() || null,
      graduationYear: item.graduationYear ? Number(item.graduationYear) : null,
      startYear: null,
      isCompleted: Boolean(item.graduationYear),
      description: null,
    };

    if (item.id) {
      await updateCandidateEducation(item.id, payload);
    } else {
      await createCandidateEducation(payload);
    }
  }

  for (const item of currentEducationItems) {
    if (item?.id && !activeEducationIds.has(item.id)) {
      await deleteCandidateEducation(item.id);
    }
  }

  return safeArray(await getCandidateEducation());
}

export function CandidateCareerPage() {
  const location = useLocation();
  const [contextState, setContextState] = useState({ status: "loading", data: null, error: null });
  const [dashboardState, setDashboardState] = useState({
    status: "idle",
    applications: [],
    contacts: [],
    recommendations: [],
    opportunities: [],
    degraded: false,
    error: null,
  });
  const [draft, setDraft] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [skillQuery, setSkillQuery] = useState("");
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [gateModalOpen, setGateModalOpen] = useState(false);
  const [redirectTo, setRedirectTo] = useState("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    loadCandidateCareerContext(controller.signal)
      .then((data) => {
        if (!active) {
          return;
        }

        setContextState({ status: "ready", data, error: null });

        if (data.kind === "candidate") {
          const onboardingDraft = createCandidateOnboardingDraft({ profile: data.profile, education: data.education });
          setDraft(onboardingDraft);
          setActiveStepIndex(getFirstIncompleteStepIndex(onboardingDraft));
          setWizardOpen(!data.onboardingComplete && !data.skippedAt);
        }
      })
      .catch((error) => {
        if (active) {
          setContextState({ status: "error", data: null, error });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (contextState.status !== "ready" || contextState.data?.kind !== "candidate" || !contextState.data.onboardingComplete) {
      return undefined;
    }

    let active = true;
    const controller = new AbortController();

    setDashboardState((current) => ({ ...current, status: "loading", error: null }));

    Promise.allSettled([
      getCandidateApplications(controller.signal),
      getCandidateContacts(controller.signal),
      getCandidateRecommendations(controller.signal),
      getOpportunities(controller.signal),
    ]).then((results) => {
      if (!active || controller.signal.aborted) {
        return;
      }

      const [applicationsResult, contactsResult, recommendationsResult, opportunitiesResult] = results;
      const failedCount = results.filter((item) => item.status === "rejected").length;

      setDashboardState({
        status: "ready",
        applications: applicationsResult.status === "fulfilled" ? safeArray(applicationsResult.value) : [],
        contacts: contactsResult.status === "fulfilled" ? safeArray(contactsResult.value) : [],
        recommendations: recommendationsResult.status === "fulfilled" ? safeArray(recommendationsResult.value) : [],
        opportunities: opportunitiesResult.status === "fulfilled" ? safeArray(opportunitiesResult.value) : [],
        degraded: failedCount > 0,
        error: failedCount === results.length
          ? (applicationsResult.reason ?? contactsResult.reason ?? recommendationsResult.reason ?? opportunitiesResult.reason)
          : null,
      });
    }).catch((error) => {
      if (!active || controller.signal.aborted) {
        return;
      }

      setDashboardState({
        status: "error",
        applications: [],
        contacts: [],
        recommendations: [],
        opportunities: [],
        degraded: false,
        error,
      });
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [contextState]);

  useEffect(() => {
    if (!location.hash) {
      return undefined;
    }

    return scheduleHashScroll(location.hash, {
      offset: 112,
      behavior: "smooth",
    });
  }, [dashboardState.status, location.hash, location.pathname]);

  const activeStep = CANDIDATE_ONBOARDING_STEPS[activeStepIndex];
  const stepError = useMemo(
    () => (draft && activeStep ? getCandidateOnboardingStepError(activeStep.key, draft) : ""),
    [activeStep, draft]
  );
  const educationValidation = useMemo(
    () => getCandidateEducationDraftErrors(draft?.educations, { requireAtLeastOne: true }),
    [draft]
  );
  const mandatoryCompletion = useMemo(
    () => (draft ? getCandidateMandatoryCompletion(draft) : 0),
    [draft]
  );
  const onboardingProgress = useMemo(
    () => (draft ? getCandidateOnboardingProgress(draft) : 0),
    [draft]
  );

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  if (contextState.status === "loading") {
    return (
      <main className="candidate-career-page candidate-career-page--loading">
        <div className="candidate-career-page__shell ui-page-shell">
          <Loader label="Подготавливаем карьерный раздел" surface />
        </div>
      </main>
    );
  }

  if (contextState.status === "error") {
    return (
      <main className="candidate-career-page">
        <div className="candidate-career-page__shell ui-page-shell">
          <PortalHeader navItems={headerNav} currentKey="career" actionHref={routes.auth.login} actionLabel="Войти / Регистрация" className="candidate-career-page__header" />
          <section className="candidate-career-page__content">
            <Alert tone="error" title="Не удалось открыть карьерный раздел" showIcon>
              {contextState.error?.message ?? "Попробуйте обновить страницу или зайти позже."}
            </Alert>
          </section>
        </div>
      </main>
    );
  }

  if (contextState.data?.redirectTo) {
    return <Navigate to={contextState.data.redirectTo} replace />;
  }

  if (contextState.data?.kind === "guest") {
    return <Navigate to={candidateLoginHref} replace />;
  }

  if (contextState.data?.kind !== "candidate" || !draft) {
    return null;
  }

  const showDashboard = contextState.data.onboardingComplete;
  const showWizard = !showDashboard && wizardOpen;
  const showBlockedState = !showDashboard && !wizardOpen && Boolean(contextState.data.skippedAt);

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage(null);
  }

  function updateEducationField(draftKey, field, value) {
    setDraft((current) => ({
      ...current,
      educations: current.educations.map((item) => (item.draftKey === draftKey ? { ...item, [field]: value } : item)),
    }));
    setMessage(null);
  }

  function addEducationItem() {
    setDraft((current) => ({ ...current, educations: [...current.educations, createCandidateEducationDraft()] }));
    setMessage(null);
  }

  function removeEducationItem(draftKey) {
    setDraft((current) => ({ ...current, educations: createEducationDraftListAfterRemove(current.educations, draftKey) }));
    setMessage(null);
  }

  function updateExperienceValue(draftKey, field, value) {
    setDraft((current) => ({
      ...current,
      experiences: current.experiences.map((item) => {
        if (item.draftKey !== draftKey) {
          return item;
        }

        if (field === "isCurrent") {
          return {
            ...item,
            isCurrent: Boolean(value),
            endMonth: value ? "" : item.endMonth,
          };
        }

        return { ...item, [field]: value };
      }),
    }));
    setMessage(null);
  }

  function addExperienceItem() {
    setDraft((current) => ({
      ...current,
      experiences: [...current.experiences, createCandidateExperienceDraft()],
    }));
    setMessage(null);
  }

  function removeExperienceItem(draftKey) {
    setDraft((current) => ({
      ...current,
      experiences: createExperienceDraftListAfterRemove(current.experiences, draftKey),
    }));
    setMessage(null);
  }

  function addSkill(skill) {
    setDraft((current) => ({ ...current, skills: current.skills.includes(skill) ? current.skills : [...current.skills, skill] }));
    setMessage(null);
  }

  function removeSkill(skill) {
    setDraft((current) => ({ ...current, skills: current.skills.filter((item) => item !== skill) }));
    setMessage(null);
  }

  async function persistDraft({ markSkipped = false } = {}) {
    const links = buildCandidateOnboardingLinks(contextState.data.profile, draft, { markSkipped });
    const refreshedEducation = await syncCandidateEducation(contextState.data.education, draft.educations);
    const profile = await updateCandidateProfile({
      name: draft.name,
      surname: draft.surname,
      thirdname: draft.thirdname || null,
      skills: draft.skills,
      links,
    });
    const refreshedProfile = await getCandidateProfile();
    const nextProfile = refreshedProfile ?? profile;
    const nextDraft = createCandidateOnboardingDraft({ profile: nextProfile, education: refreshedEducation });
    const nextCompletion = getCandidateMandatoryCompletion(nextDraft);

    setDraft(nextDraft);
    setContextState((current) => ({
      ...current,
      data: {
        ...current.data,
        profile: nextProfile,
        education: refreshedEducation,
        mandatoryCompletion: nextCompletion,
        onboardingComplete: nextCompletion === 100,
        skippedAt: nextDraft.skippedAt,
        completedAt: nextDraft.completedAt,
        showWarningState: nextCompletion < 20,
      },
    }));

    return { profile: nextProfile, education: refreshedEducation, draft: nextDraft, completion: nextCompletion };
  }

  async function handleContinue() {
    if (!draft || !activeStep) {
      return;
    }

    if (stepError) {
      setMessage({ tone: "error", title: "Шаг не заполнен", text: stepError });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const result = await persistDraft();

      if (result.completion === 100 && activeStepIndex === CANDIDATE_ONBOARDING_STEPS.length - 1) {
        setWizardOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (activeStepIndex === CANDIDATE_ONBOARDING_STEPS.length - 1) {
        setMessage({ tone: "success", title: "Профиль сохранён", text: "Обязательный минимум заполнен, карьерный раздел открыт." });
        setWizardOpen(false);
        return;
      }

      setActiveStepIndex((current) => current + 1);
      setSkillQuery("");
      setMessage({
        tone: "success",
        title: "Шаг сохранён",
        text: `Обязательная заполненность профиля: ${result.completion}%. Продолжаем.`,
      });
    } catch (error) {
      setMessage({ tone: "error", title: "Не удалось сохранить шаг", text: error?.message ?? "Попробуйте ещё раз." });
    } finally {
      setSaving(false);
    }
  }

  async function handleSkipNow() {
    setSaving(true);
    setMessage(null);

    try {
      await persistDraft({ markSkipped: true });
      setWizardOpen(false);
      setSkipModalOpen(false);
      setRedirectTo(routes.candidate.profile);
    } catch (error) {
      setMessage({ tone: "error", title: "Не удалось сохранить черновик", text: error?.message ?? "Попробуйте ещё раз." });
      setSkipModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="candidate-career-page">
      <div className="candidate-career-page__shell ui-page-shell">
        <PortalHeader navItems={headerNav} currentKey="career" actionHref={routes.candidate.profile} actionLabel="Профиль" className="candidate-career-page__header" />

        <section className="candidate-career-page__content">
          {showDashboard ? (
            dashboardState.status === "loading" || dashboardState.status === "idle" ? (
              <Loader label="Собираем карьерные рекомендации" surface />
            ) : dashboardState.status === "error" ? (
              <Alert tone="error" title="Не удалось собрать карьерные рекомендации" showIcon>
                {dashboardState.error?.message ?? "Попробуйте обновить страницу чуть позже."}
              </Alert>
            ) : (
              <CandidateCareerDashboard profile={contextState.data.profile} dashboardState={dashboardState} />
            )
          ) : null}

          {showBlockedState ? (
            <Card className="candidate-career-wizard" data-testid="candidate-career-gated">
              <div className="candidate-career-wizard__head">
                <div>
                  <Tag className="candidate-career-wizard__badge">Карьера ограничена</Tag>
                  <h2>Заполните обязательные поля профиля, чтобы открыть карьерные рекомендации и отклики</h2>
                  <p>Вы можете пользоваться личным кабинетом дальше, но раздел «Карьера» и отклики на возможности останутся недоступны, пока профиль не заполнен.</p>
                </div>

                <Card className="candidate-career-wizard__status">
                  <span>Заполненность</span>
                  <strong>{mandatoryCompletion}%</strong>
                  <p>Обязательный минимум профиля</p>
                </Card>
              </div>

              <Alert tone="warning" title="Неполный профиль" showIcon>
                Продолжите заполнение сейчас или вернитесь позже через личный кабинет.
              </Alert>

              <div className="candidate-career-wizard__actions">
                <Button type="button" variant="secondary" href={routes.candidate.profile}>
                  Перейти в кабинет
                </Button>
                <Button type="button" onClick={() => setWizardOpen(true)}>
                  Вернуться к заполнению
                </Button>
              </div>
            </Card>
          ) : null}

          {showWizard ? (
            <div className="candidate-career-wizard" data-testid="candidate-career-wizard">
              <div className="candidate-career-wizard__head">
                <div>
                  <Tag className="candidate-career-wizard__badge">Профиль соискателя</Tag>
                  <h2>Заполните обязательный минимум профиля</h2>
                  <p>После этого откроются карьерные рекомендации, а также возможность откликаться на стажировки, вакансии и другие возможности.</p>
                </div>

                <Card className="candidate-career-wizard__status">
                  <span>Прогресс</span>
                  <strong>{onboardingProgress}%</strong>
                  <p>{activeStepIndex + 1} из {CANDIDATE_ONBOARDING_STEPS.length} шагов</p>
                </Card>
              </div>

              {message ? <Alert tone={message.tone} title={message.title} showIcon>{message.text}</Alert> : null}

              {activeStep.key === "profession" ? (
                <ProfessionStep
                  draft={draft}
                  onProfessionChange={(value) => updateField("profession", value)}
                  onAdditionalProfessionsChange={(value) => updateField("additionalProfessions", value)}
                />
              ) : null}
              {activeStep.key === "basics" ? <BasicsStep draft={draft} onFieldChange={updateField} /> : null}
              {activeStep.key === "education" ? (
                <EducationStep
                  draft={draft}
                  educationErrors={educationValidation.itemErrors}
                  onEducationFieldChange={updateEducationField}
                  onEducationAdd={addEducationItem}
                  onEducationRemove={removeEducationItem}
                />
              ) : null}
              {activeStep.key === "skills" ? (
                <SkillsStep
                  draft={draft}
                  skillQuery={skillQuery}
                  onSkillQueryChange={setSkillQuery}
                  onAddSkill={addSkill}
                  onRemoveSkill={removeSkill}
                />
              ) : null}
              {activeStep.key === "experience" ? (
                <ExperienceStep
                  draft={draft}
                  onNoExperienceChange={(value) => updateField("noExperience", value)}
                  onExperienceChange={updateExperienceValue}
                  onExperienceAdd={addExperienceItem}
                  onExperienceRemove={removeExperienceItem}
                />
              ) : null}
              {activeStep.key === "goal" ? <GoalStep draft={draft} onFieldChange={updateField} /> : null}

              <div className="candidate-career-wizard__footer">
                <StepProgress activeIndex={activeStepIndex} />
                <div className="candidate-career-wizard__actions">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={saving}
                    onClick={() => setSkipModalOpen(true)}
                  >
                    Пропустить сейчас
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={activeStepIndex === 0 || saving}
                    onClick={() => {
                      setActiveStepIndex((current) => Math.max(current - 1, 0));
                      setMessage(null);
                    }}
                  >
                    Назад
                  </Button>
                  <Button type="button" disabled={saving} onClick={handleContinue}>
                    {saving ? "Сохраняем..." : activeStepIndex === CANDIDATE_ONBOARDING_STEPS.length - 1 ? "Открыть карьеру" : "Сохранить и продолжить"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <Modal
        open={skipModalOpen}
        onClose={() => setSkipModalOpen(false)}
        title="Пропустить заполнение профиля?"
        description="Профиль сохранится как черновик. Личный кабинет останется доступен, но карьера и отклики будут ограничены до заполнения обязательных полей."
        tone="warning"
        showIcon
        actions={(
          <>
            <Button type="button" variant="secondary" onClick={() => setSkipModalOpen(false)}>
              Вернуться
            </Button>
            <Button type="button" onClick={handleSkipNow} disabled={saving}>
              {saving ? "Сохраняем..." : "Пропустить сейчас"}
            </Button>
          </>
        )}
      />

      <CandidateProfileGateModal
        open={gateModalOpen}
        completion={mandatoryCompletion}
        onClose={() => setGateModalOpen(false)}
        onContinue={() => {
          setGateModalOpen(false);
          setWizardOpen(true);
        }}
      />
    </main>
  );
}
