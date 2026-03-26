import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { buildAuthLoginRoute, PUBLIC_HEADER_NAV_ITEMS, routes } from "../../app/routes";
import {
  createCandidateEducation,
  getCandidateEducation,
  getCandidateProfile,
  updateCandidateEducation,
  updateCandidateProfile,
} from "../../api/candidate";
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
import { Alert, Button, Card, Checkbox, FormField, Input, Loader, SearchInput, Select, Tag, Textarea } from "../../shared/ui";
import { loadCandidateCareerContext } from "./candidate-access";
import "./candidate-career.css";

const headerNav = PUBLIC_HEADER_NAV_ITEMS;
const candidateLoginHref = buildAuthLoginRoute({ role: "candidate" });

function normalizeSearchValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4 12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 4 4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CareerHero() {
  return (
    <section className="candidate-career-hero" aria-labelledby="candidate-career-title">
      <div className="candidate-career-hero__content">
        <Tag className="candidate-career-hero__tag">Карьерный маршрут для соискателя</Tag>
        <h1 id="candidate-career-title" className="candidate-career-hero__title">
          Хочешь построить карьеру?
        </h1>
        <p className="candidate-career-hero__description">
          Пройди регистрацию и заполни простую форму. Мы соберём минимальное резюме, поймём твои навыки и откроем доступ к карьерным возможностям.
        </p>

        <div className="candidate-career-hero__actions">
          <Button as="a" href={routes.auth.registerCandidate} className="candidate-career-hero__primary">
            Зарегистрироваться
          </Button>
          <Button as="a" href={candidateLoginHref} variant="secondary">
            Уже зарегистрирован
          </Button>
        </div>
      </div>

      <Card className="candidate-career-hero__aside">
        <strong>Регистрация соискателя</strong>
        <p>После регистрации собираем доп. информацию, которая формирует стартовое резюме и открывает карьерный кабинет.</p>
        <ul className="candidate-career-hero__aside-list">
          <li>Профессия и цели</li>
          <li>Базовые контакты и образование</li>
          <li>Навыки и опыт</li>
        </ul>
      </Card>
    </section>
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
    return CANDIDATE_PROFESSION_OPTIONS.filter((option) => (
      !normalizedQuery || normalizeSearchValue(option).includes(normalizedQuery)
    ));
  }, [professionQuery]);

  return (
    <div className="candidate-career-step">
      <div className="candidate-career-step__head">
        <h2>Выберите или укажите профессию</h2>
        <p>Это нужно, чтобы рекомендации и карьерный кабинет сразу открывались в правильном контексте.</p>
      </div>

      <SearchInput
        value={professionQuery}
        onValueChange={onProfessionQueryChange}
        placeholder="Поиск профессии"
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
        <p>Эти данные сохраняются в профиль и используются как база для резюме кандидата.</p>
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
          <Select
            value={draft.gender}
            onValueChange={(value) => onFieldChange("gender", value)}
            placeholder="Выберите пол"
            options={CANDIDATE_GENDER_OPTIONS}
          />
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

function EducationStep({ draft, onEducationFieldChange }) {
  return (
    <div className="candidate-career-step">
      <div className="candidate-career-step__head">
        <h2>Какое учебное заведение включить в резюме</h2>
        <p>Добавь хотя бы одну запись об образовании. Этого достаточно, чтобы сформировать стартовое резюме соискателя.</p>
      </div>

      <div className="candidate-career-grid candidate-career-grid--two">
        <FormField label="Учебное заведение" required>
          <Input
            value={draft.education.institutionName}
            onValueChange={(value) => onEducationFieldChange("institutionName", value)}
            placeholder="ЧГУ им. И. Н. Ульянова"
          />
        </FormField>
        <FormField label="Год окончания" required>
          <Input
            value={draft.education.graduationYear}
            onValueChange={(value) => onEducationFieldChange("graduationYear", value.replace(/\D/g, "").slice(0, 4))}
            placeholder="2027"
          />
        </FormField>
      </div>

      <div className="candidate-career-grid candidate-career-grid--two">
        <FormField label="Факультет">
          <Input value={draft.education.faculty} onValueChange={(value) => onEducationFieldChange("faculty", value)} placeholder="Факультет" />
        </FormField>
        <FormField label="Специализация">
          <Input
            value={draft.education.specialization}
            onValueChange={(value) => onEducationFieldChange("specialization", value)}
            placeholder="Направление подготовки"
          />
        </FormField>
      </div>
    </div>
  );
}

function SkillsStep({ draft, skillQuery, onSkillQueryChange, onAddSkill, onRemoveSkill }) {
  const filteredSkills = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(skillQuery);

    return CANDIDATE_SKILL_OPTIONS.filter((option) => {
      if (draft.skills.includes(option)) {
        return false;
      }

      return !normalizedQuery || normalizeSearchValue(option).includes(normalizedQuery);
    });
  }, [draft.skills, skillQuery]);

  return (
    <div className="candidate-career-step">
      <div className="candidate-career-step__head">
        <h2>Какими навыками владеете</h2>
        <p>Добавьте ключевые навыки. Их мы используем для подбора возможностей и карточки кандидата.</p>
      </div>

      <SearchInput
        value={skillQuery}
        onValueChange={onSkillQueryChange}
        placeholder="Поиск навыков"
        className="candidate-career-search"
        clearLabel="Очистить поиск навыков"
      />

      <div className="candidate-career-chip-cloud candidate-career-chip-cloud--selected">
        {draft.skills.length ? (
          draft.skills.map((skill) => (
            <button key={skill} type="button" className="candidate-career-chip candidate-career-chip--selected" onClick={() => onRemoveSkill(skill)}>
              <span>{skill}</span>
              <CloseIcon />
            </button>
          ))
        ) : (
          <p className="candidate-career-empty">Пока не выбрано ни одного навыка.</p>
        )}
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
        <p>Если опыта нет, просто отметьте это. Если есть, добавьте минимум одну рабочую историю.</p>
      </div>

      <Checkbox
        checked={draft.experience.noExperience}
        onChange={(event) => onExperienceFieldChange("noExperience", event.target.checked)}
        className="candidate-career-checkbox"
      >
        <>
          <span className="ui-check__label">Нет опыта работы</span>
          <span className="ui-check__hint">Под этот сценарий мы подберём стажировки, джуниор-позиции и карьерные события.</span>
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
            <Textarea
              value={draft.experience.summary}
              onValueChange={(value) => onExperienceFieldChange("summary", value)}
              rows={4}
              autoResize
              placeholder="Кратко опишите, что делали и за что отвечали."
            />
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
        <Textarea
          value={draft.goal}
          onValueChange={(value) => onFieldChange("goal", value)}
          rows={5}
          autoResize
          placeholder="Например: пройти стажировку на должность ux/ui дизайнера."
        />
      </FormField>
    </div>
  );
}

export function CandidateCareerPage() {
  const navigate = useNavigate();
  const [contextState, setContextState] = useState({
    status: "loading",
    data: null,
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
        if (!active) {
          return;
        }

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

  const activeStep = CANDIDATE_ONBOARDING_STEPS[activeStepIndex];
  const stepError = useMemo(
    () => (draft && activeStep ? getCandidateOnboardingStepError(activeStep.key, draft) : ""),
    [activeStep, draft]
  );
  const onboardingProgress = useMemo(() => (draft ? getCandidateOnboardingProgress(draft) : 0), [draft]);

  if (contextState.status === "loading") {
    return (
      <main className="candidate-career-page candidate-career-page--loading">
        <div className="candidate-career-page__shell">
          <Loader label="Подготавливаем карьерный маршрут" surface />
        </div>
      </main>
    );
  }

  if (contextState.status === "error") {
    return (
      <main className="candidate-career-page">
        <div className="candidate-career-page__shell">
          <PortalHeader
            navItems={headerNav}
            currentKey="career"
            actionHref={routes.auth.login}
            actionLabel="Войти / Регистрация"
            className="candidate-career-page__header"
          />

          <section className="candidate-career-page__content">
            <Alert tone="error" title="Не удалось открыть карьерный маршрут" showIcon>
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

  if (contextState.data?.kind === "candidate" && contextState.data.onboardingComplete) {
    return <Navigate to={routes.candidate.profile} replace />;
  }

  const isGuest = contextState.data?.kind === "guest";

  if (!isGuest && !draft) {
    return (
      <main className="candidate-career-page candidate-career-page--loading">
        <div className="candidate-career-page__shell">
          <Loader label="Загружаем анкету кандидата" surface />
        </div>
      </main>
    );
  }

  const updateField = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage(null);
  };

  const updateEducationField = (field, value) => {
    setDraft((current) => ({
      ...current,
      education: {
        ...current.education,
        [field]: value,
      },
    }));
    setMessage(null);
  };

  const updateExperienceField = (field, value) => {
    setDraft((current) => ({
      ...current,
      experience: {
        ...current.experience,
        [field]: field === "noExperience" ? Boolean(value) : value,
      },
    }));
    setMessage(null);
  };

  const addSkill = (skill) => {
    setDraft((current) => ({
      ...current,
      skills: current.skills.includes(skill) ? current.skills : [...current.skills, skill],
    }));
    setMessage(null);
  };

  const removeSkill = (skill) => {
    setDraft((current) => ({
      ...current,
      skills: current.skills.filter((item) => item !== skill),
    }));
    setMessage(null);
  };

  async function persistActiveStep() {
    if (!draft || !activeStep || contextState.data?.kind !== "candidate") {
      return;
    }

    const links = buildCandidateOnboardingLinks(contextState.data.profile, draft);

    switch (activeStep.key) {
      case "basics": {
        const profile = await updateCandidateProfile({
          name: draft.name,
          surname: draft.surname,
          thirdname: draft.thirdname || null,
          links,
        });

        setContextState((current) => ({
          ...current,
          data: {
            ...current.data,
            profile,
          },
        }));
        return;
      }
      case "skills": {
        const profile = await updateCandidateProfile({
          skills: draft.skills,
          links,
        });

        setContextState((current) => ({
          ...current,
          data: {
            ...current.data,
            profile,
          },
        }));
        return;
      }
      case "education": {
        const payload = {
          institutionName: draft.education.institutionName,
          faculty: draft.education.faculty || null,
          specialization: draft.education.specialization || null,
          graduationYear: draft.education.graduationYear ? Number(draft.education.graduationYear) : null,
          startYear: null,
          isCompleted: Boolean(draft.education.graduationYear),
          description: null,
        };

        let educationId = draft.education.id;

        if (educationId) {
          await updateCandidateEducation(educationId, payload);
        } else {
          const result = await createCandidateEducation(payload);
          educationId = typeof result === "number" ? result : result?.id ?? null;
        }

        const profile = await updateCandidateProfile({ links });
        const refreshedEducation = await getCandidateEducation();
        const refreshedProfile = await getCandidateProfile();

        setDraft((current) => ({
          ...current,
          education: {
            ...current.education,
            id: educationId,
          },
        }));
        setContextState((current) => ({
          ...current,
          data: {
            ...current.data,
            profile: refreshedProfile ?? profile,
            education: Array.isArray(refreshedEducation) ? refreshedEducation : current.data.education,
          },
        }));
        return;
      }
      default: {
        const profile = await updateCandidateProfile({ links });

        setContextState((current) => ({
          ...current,
          data: {
            ...current.data,
            profile,
          },
        }));
      }
    }
  }

  async function handleContinue() {
    if (!draft || !activeStep) {
      return;
    }

    if (stepError) {
      setMessage({
        tone: "error",
        title: "Шаг не заполнен",
        text: stepError,
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await persistActiveStep();

      if (activeStepIndex === CANDIDATE_ONBOARDING_STEPS.length - 1) {
        navigate(routes.candidate.profile);
        return;
      }

      const nextProgress = draft ? getCandidateOnboardingProgress(draft) : 0;

      setActiveStepIndex((current) => current + 1);
      setProfessionQuery("");
      setSkillQuery("");
      setMessage({
        tone: "success",
        title: "Шаг сохранён",
        text: `Заполненность профиля: ${nextProgress}%. Продолжаем.`,
      });
    } catch (error) {
      setMessage({
        tone: "error",
        title: "Не удалось сохранить шаг",
        text: error?.message ?? "Попробуйте ещё раз.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="candidate-career-page">
      <div className="candidate-career-page__shell">
        <PortalHeader
          navItems={headerNav}
          currentKey="career"
          actionHref={isGuest ? routes.auth.login : routes.candidate.profile}
          actionLabel={isGuest ? "Войти / Регистрация" : "Профиль"}
          className="candidate-career-page__header"
        />

        <section className="candidate-career-page__content">
          {isGuest ? (
            <CareerHero />
          ) : (
            <div className="candidate-career-wizard" data-testid="candidate-career-wizard">
              <div className="candidate-career-wizard__head">
                <div>
                  <Tag className="candidate-career-wizard__badge">Профиль соискателя</Tag>
                  <h1>Сначала заполним профиль, потом откроем карьерный кабинет</h1>
                  <p>Доступ к разделу карьеры появляется только после базового onboarding. Это защищает сценарий от пустых профилей и даёт точные рекомендации.</p>
                </div>

                <Card className="candidate-career-wizard__status">
                  <span>Прогресс</span>
                  <strong>{onboardingProgress}%</strong>
                  <p>{activeStepIndex + 1} из {CANDIDATE_ONBOARDING_STEPS.length} шагов</p>
                </Card>
              </div>

              {message ? (
                <Alert tone={message.tone} title={message.title} showIcon>
                  {message.text}
                </Alert>
              ) : null}

              {activeStep.key === "profession" ? (
                <ProfessionStep
                  draft={draft}
                  professionQuery={professionQuery}
                  onProfessionQueryChange={setProfessionQuery}
                  onProfessionSelect={(value) => updateField("profession", value)}
                />
              ) : null}

              {activeStep.key === "basics" ? <BasicsStep draft={draft} onFieldChange={updateField} /> : null}
              {activeStep.key === "education" ? <EducationStep draft={draft} onEducationFieldChange={updateEducationField} /> : null}
              {activeStep.key === "skills" ? (
                <SkillsStep
                  draft={draft}
                  skillQuery={skillQuery}
                  onSkillQueryChange={setSkillQuery}
                  onAddSkill={addSkill}
                  onRemoveSkill={removeSkill}
                />
              ) : null}
              {activeStep.key === "experience" ? <ExperienceStep draft={draft} onExperienceFieldChange={updateExperienceField} /> : null}
              {activeStep.key === "goal" ? <GoalStep draft={draft} onFieldChange={updateField} /> : null}

              <div className="candidate-career-wizard__footer">
                <StepProgress activeIndex={activeStepIndex} />

                <div className="candidate-career-wizard__actions">
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
                    {saving ? "Сохраняем..." : activeStepIndex === CANDIDATE_ONBOARDING_STEPS.length - 1 ? "Найти возможности" : "Сохранить и продолжить"}
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
