import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { buildAuthLoginRoute, PUBLIC_HEADER_NAV_ITEMS, routes } from "../../app/routes";
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
import { getOpportunities } from "../../api/opportunities";
import {
  createCandidateEducationDraft,
  createEducationDraftListAfterRemove,
  getActiveCandidateEducationDrafts,
  getCandidateEducationDraftErrors,
} from "../../candidate-portal/education";
import {
  buildCandidateOnboardingLinks,
  CANDIDATE_CITIZENSHIP_OPTIONS,
  CANDIDATE_CITY_OPTIONS,
  CANDIDATE_GENDER_OPTIONS,
  CANDIDATE_ONBOARDING_STEPS,
  CANDIDATE_PROFESSION_OPTIONS,
  CANDIDATE_SKILL_OPTIONS,
  createCandidateOnboardingDraft,
  getCandidateOnboardingProgress,
  getCandidateOnboardingStepError,
} from "../../candidate-portal/onboarding";
import { PortalHeader } from "../../widgets/layout";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  EducationListEditor,
  FormField,
  Input,
  Loader,
  SearchInput,
  Select,
  Tag,
  Textarea,
} from "../../shared/ui";
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

function ProfessionStep({ draft, professionQuery, onProfessionQueryChange, onProfessionSelect }) {
  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(professionQuery);
    return CANDIDATE_PROFESSION_OPTIONS.filter((option) => !normalizedQuery || normalizeSearchValue(option).includes(normalizedQuery));
  }, [professionQuery]);

  return (
    <div className="candidate-career-step">
      <div className="candidate-career-step__head">
        <h2>Выберите или укажите профессию</h2>
        <p>Это поможет открыть карьерный раздел в правильном контексте и собрать релевантные рекомендации.</p>
      </div>

      <SearchInput
        value={professionQuery}
        onValueChange={onProfessionQueryChange}
        placeholder="Поиск профессии"
        width="full"
        className="candidate-career-search"
        clearLabel="Очистить поиск профессии"
      />

      <div className="candidate-career-option-list" role="radiogroup" aria-label="Профессия">
        {filteredOptions.map((option) => {
          const checked = draft.profession === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={checked}
              className={`candidate-career-option ${checked ? "is-selected" : ""}`.trim()}
              onClick={() => onProfessionSelect(option)}
            >
              <span className="candidate-career-option__bullet" aria-hidden="true" />
              <span>{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BasicsStep({ draft, onFieldChange }) {
  return (
    <div className="candidate-career-step">
      <div className="candidate-career-step__head">
        <h2>Заполните основную информацию</h2>
        <p>Эти данные сохраняются в профиль и формируют стартовую карточку кандидата для карьерного раздела.</p>
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
          <Select
            value={draft.city}
            onValueChange={(value) => onFieldChange("city", value)}
            placeholder="Выберите город"
            options={CANDIDATE_CITY_OPTIONS.map((value) => ({ value, label: value }))}
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
        <h2>Какие учебные заведения включить в резюме</h2>
        <p>Добавьте одно или несколько мест обучения. Они сразу попадут в профиль и повлияют на рекомендации.</p>
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
        <h2>Какими навыками владеете</h2>
        <p>Добавьте ключевые навыки. Они используются для карьерных подборок и персональных рекомендаций.</p>
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
        )) : <p className="candidate-career-empty">Пока не выбрано ни одного навыка.</p>}
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

function ExperienceStep({ draft, onExperienceFieldChange }) {
  return (
    <div className="candidate-career-step">
      <div className="candidate-career-step__head">
        <h2>Ваш опыт работы</h2>
        <p>Если опыта нет, отметьте это. Если есть, добавьте хотя бы одну запись, чтобы рекомендации были точнее.</p>
      </div>

      <Checkbox checked={draft.experience.noExperience} onChange={(event) => onExperienceFieldChange("noExperience", event.target.checked)} className="candidate-career-checkbox">
        <>
          <span className="ui-check__label">Нет опыта работы</span>
          <span className="ui-check__hint">Под этот сценарий мы подберем стажировки, джуниор-позиции и карьерные события.</span>
        </>
      </Checkbox>

      {!draft.experience.noExperience ? (
        <>
          <FormField label="Компания" required>
            <Input value={draft.experience.company} onValueChange={(value) => onExperienceFieldChange("company", value)} placeholder="IT-Планета" />
          </FormField>
          <FormField label="Должность или профессия" required>
            <Input value={draft.experience.role} onValueChange={(value) => onExperienceFieldChange("role", value)} placeholder="UX/UI дизайнер" />
          </FormField>
          <FormField label="Обязанности и достижения" required>
            <Textarea value={draft.experience.summary} onValueChange={(value) => onExperienceFieldChange("summary", value)} rows={4} autoResize placeholder="Кратко опишите, что делали и за что отвечали." />
          </FormField>
          <FormField label="Срок работы" required>
            <Input value={draft.experience.period} onValueChange={(value) => onExperienceFieldChange("period", value)} placeholder="Июнь 2024 — Январь 2025" />
          </FormField>
        </>
      ) : null}
    </div>
  );
}

function GoalStep({ draft, onFieldChange }) {
  return (
    <div className="candidate-career-step">
      <div className="candidate-career-step__head">
        <h2>Ваша цель</h2>
        <p>Последний шаг. Сформулируйте, зачем вы приходите на платформу и чего хотите достичь в ближайшее время.</p>
      </div>

      <FormField label="Цель" required>
        <Textarea value={draft.goal} onValueChange={(value) => onFieldChange("goal", value)} rows={5} autoResize placeholder="Например: пройти стажировку на позицию UX/UI дизайнера и собрать сильное портфолио." />
      </FormField>
    </div>
  );
}

export function CandidateCareerPage() {
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
  const [professionQuery, setProfessionQuery] = useState("");
  const [skillQuery, setSkillQuery] = useState("");
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    loadCandidateCareerContext(controller.signal)
      .then((data) => {
        if (!active) return;
        setContextState({ status: "ready", data, error: null });
        if (data.kind === "candidate" && !data.onboardingComplete) {
          setDraft(createCandidateOnboardingDraft({ profile: data.profile, education: data.education }));
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
      if (!active || controller.signal.aborted) return;

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
      if (!active || controller.signal.aborted) return;

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

  const activeStep = CANDIDATE_ONBOARDING_STEPS[activeStepIndex];
  const stepError = useMemo(() => (draft && activeStep ? getCandidateOnboardingStepError(activeStep.key, draft) : ""), [activeStep, draft]);
  const educationValidation = useMemo(() => getCandidateEducationDraftErrors(draft?.educations, { requireAtLeastOne: true }), [draft]);
  const onboardingProgress = useMemo(() => (draft ? getCandidateOnboardingProgress(draft) : 0), [draft]);

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

  const showDashboard = contextState.data?.kind === "candidate" && contextState.data.onboardingComplete;

  if (!showDashboard && !draft) {
    return (
      <main className="candidate-career-page candidate-career-page--loading">
        <div className="candidate-career-page__shell ui-page-shell">
          <Loader label="Загружаем анкету кандидата" surface />
        </div>
      </main>
    );
  }

  const updateField = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage(null);
  };

  const updateEducationField = (draftKey, field, value) => {
    setDraft((current) => ({
      ...current,
      educations: current.educations.map((item) => (item.draftKey === draftKey ? { ...item, [field]: value } : item)),
    }));
    setMessage(null);
  };

  const addEducationItem = () => {
    setDraft((current) => ({ ...current, educations: [...current.educations, createCandidateEducationDraft()] }));
    setMessage(null);
  };

  const removeEducationItem = (draftKey) => {
    setDraft((current) => ({ ...current, educations: createEducationDraftListAfterRemove(current.educations, draftKey) }));
    setMessage(null);
  };

  const updateExperienceField = (field, value) => {
    setDraft((current) => ({
      ...current,
      experience: { ...current.experience, [field]: field === "noExperience" ? Boolean(value) : value },
    }));
    setMessage(null);
  };

  const addSkill = (skill) => {
    setDraft((current) => ({ ...current, skills: current.skills.includes(skill) ? current.skills : [...current.skills, skill] }));
    setMessage(null);
  };

  const removeSkill = (skill) => {
    setDraft((current) => ({ ...current, skills: current.skills.filter((item) => item !== skill) }));
    setMessage(null);
  };

  async function persistActiveStep() {
    if (!draft || !activeStep || contextState.data?.kind !== "candidate") {
      return;
    }

    const links = buildCandidateOnboardingLinks(contextState.data.profile, draft);

    if (activeStep.key === "basics") {
      const profile = await updateCandidateProfile({ name: draft.name, surname: draft.surname, thirdname: draft.thirdname || null, links });
      setContextState((current) => ({ ...current, data: { ...current.data, profile } }));
      return;
    }

    if (activeStep.key === "skills") {
      const profile = await updateCandidateProfile({ skills: draft.skills, links });
      setContextState((current) => ({ ...current, data: { ...current.data, profile } }));
      return;
    }

    if (activeStep.key === "education") {
      const activeEducationItems = getActiveCandidateEducationDrafts(draft.educations);
      const currentEducationItems = safeArray(contextState.data.education);
      const currentEducationIds = new Set(activeEducationItems.map((item) => item.id).filter(Boolean));

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
        if (item?.id && !currentEducationIds.has(item.id) && !activeEducationItems.some((draftItem) => draftItem.id === item.id)) {
          await deleteCandidateEducation(item.id);
        }
      }

      const profile = await updateCandidateProfile({ links });
      const refreshedEducation = safeArray(await getCandidateEducation());
      const refreshedProfile = await getCandidateProfile();

      setDraft((current) => ({
        ...current,
        educations: createCandidateOnboardingDraft({ profile: refreshedProfile ?? profile, education: refreshedEducation }).educations,
      }));
      setContextState((current) => ({
        ...current,
        data: { ...current.data, profile: refreshedProfile ?? profile, education: refreshedEducation },
      }));
      return;
    }

    const profile = await updateCandidateProfile({ links });
    setContextState((current) => ({ ...current, data: { ...current.data, profile } }));
  }

  async function handleContinue() {
    if (!draft || !activeStep) return;

    if (stepError) {
      setMessage({ tone: "error", title: "Шаг не заполнен", text: stepError });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await persistActiveStep();

      if (activeStepIndex === CANDIDATE_ONBOARDING_STEPS.length - 1) {
        setContextState((current) => ({ ...current, data: { ...current.data, onboardingComplete: true } }));
        setDraft(null);
        setProfessionQuery("");
        setSkillQuery("");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const nextProgress = draft ? getCandidateOnboardingProgress(draft) : 0;
      setActiveStepIndex((current) => current + 1);
      setProfessionQuery("");
      setSkillQuery("");
      setMessage({ tone: "success", title: "Шаг сохранен", text: `Заполненность профиля: ${nextProgress}%. Продолжаем.` });
    } catch (error) {
      setMessage({ tone: "error", title: "Не удалось сохранить шаг", text: error?.message ?? "Попробуйте еще раз." });
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
          ) : (
            <div className="candidate-career-wizard" data-testid="candidate-career-wizard">
              <div className="candidate-career-wizard__head">
                <div>
                  <Tag className="candidate-career-wizard__badge">Профиль соискателя</Tag>
                  <h2>Сначала заполним профиль, потом откроем карьерный раздел</h2>
                  <p>Доступ к карьере появляется только после базового onboarding. Так рекомендации и подборки не строятся на пустом профиле.</p>
                </div>

                <Card className="candidate-career-wizard__status">
                  <span>Прогресс</span>
                  <strong>{onboardingProgress}%</strong>
                  <p>{activeStepIndex + 1} из {CANDIDATE_ONBOARDING_STEPS.length} шагов</p>
                </Card>
              </div>

              {message ? <Alert tone={message.tone} title={message.title} showIcon>{message.text}</Alert> : null}

              {activeStep.key === "profession" ? <ProfessionStep draft={draft} professionQuery={professionQuery} onProfessionQueryChange={setProfessionQuery} onProfessionSelect={(value) => updateField("profession", value)} /> : null}
              {activeStep.key === "basics" ? <BasicsStep draft={draft} onFieldChange={updateField} /> : null}
              {activeStep.key === "education" ? <EducationStep draft={draft} educationErrors={educationValidation.itemErrors} onEducationFieldChange={updateEducationField} onEducationAdd={addEducationItem} onEducationRemove={removeEducationItem} /> : null}
              {activeStep.key === "skills" ? <SkillsStep draft={draft} skillQuery={skillQuery} onSkillQueryChange={setSkillQuery} onAddSkill={addSkill} onRemoveSkill={removeSkill} /> : null}
              {activeStep.key === "experience" ? <ExperienceStep draft={draft} onExperienceFieldChange={updateExperienceField} /> : null}
              {activeStep.key === "goal" ? <GoalStep draft={draft} onFieldChange={updateField} /> : null}

              <div className="candidate-career-wizard__footer">
                <StepProgress activeIndex={activeStepIndex} />
                <div className="candidate-career-wizard__actions">
                  <Button type="button" variant="secondary" disabled={activeStepIndex === 0 || saving} onClick={() => { setActiveStepIndex((current) => Math.max(current - 1, 0)); setMessage(null); }}>
                    Назад
                  </Button>
                  <Button type="button" disabled={saving} onClick={handleContinue}>
                    {saving ? "Сохраняем..." : activeStepIndex === CANDIDATE_ONBOARDING_STEPS.length - 1 ? "Открыть карьеру" : "Сохранить и продолжить"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
