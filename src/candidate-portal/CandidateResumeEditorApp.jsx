import { useEffect, useMemo, useState } from "react";
import {
  createCandidateAchievement,
  createCandidateEducation,
  deleteCandidateAchievement,
  deleteCandidateEducation,
  getCandidateAchievements,
  getCandidateEducation,
  getCandidateProfile,
  updateCandidateAchievement,
  updateCandidateEducation,
  updateCandidateProfile,
} from "../api/candidate";
import { ApiError } from "../lib/http";
import { Alert, Button, Card, EmptyState, FormField, Input, Loader, SectionHeader, Switch, TagSelector, Textarea } from "../shared/ui";
import { CANDIDATE_PAGE_ROUTES, CANDIDATE_SKILL_SUGGESTIONS } from "./config";
import { getCandidateSkills } from "./mappers";

function createProfileDraft(profile) {
  return {
    name: profile?.name ?? "",
    surname: profile?.surname ?? "",
    thirdname: profile?.thirdname ?? "",
    description: profile?.description ?? "",
    skills: getCandidateSkills(profile),
  };
}

function createEducationDraft(item = {}) {
  return {
    id: item.id ?? null,
    draftKey: item.id ? `education-${item.id}` : `education-new-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
    institutionName: item.institutionName ?? "",
    faculty: item.faculty ?? "",
    specialization: item.specialization ?? "",
    startYear: item.startYear ? String(item.startYear) : "",
    graduationYear: item.graduationYear ? String(item.graduationYear) : "",
    isCompleted: Boolean(item.isCompleted),
    description: item.description ?? "",
  };
}

function createAchievementDraft(item = {}) {
  return {
    id: item.id ?? null,
    draftKey: item.id ? `achievement-${item.id}` : `achievement-new-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
    title: item.title ?? "",
    location: item.location ?? "",
    description: item.description ?? "",
    obtainDate: toDateInputValue(item.obtainDate),
  };
}

function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function toUnixSeconds(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return Math.floor(parsed.getTime() / 1000);
}

function ResumeEditorSection({ eyebrow, title, description, children, actions }) {
  return (
    <Card className="candidate-resume-panel">
      <SectionHeader eyebrow={eyebrow} title={title} description={description} size="md" actions={actions} />
      <div className="candidate-page-stack">{children}</div>
    </Card>
  );
}

function EducationCard({ item, busyKey, onChange, onSave, onDelete }) {
  const isBusy = busyKey === item.draftKey;

  return (
    <Card className="candidate-page-panel">
      <div className="candidate-page-stack">
        <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
          <FormField label="Учебное заведение" required>
            <Input value={item.institutionName} onValueChange={(value) => onChange(item.draftKey, "institutionName", value)} />
          </FormField>
          <FormField label="Факультет">
            <Input value={item.faculty} onValueChange={(value) => onChange(item.draftKey, "faculty", value)} />
          </FormField>
        </div>

        <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
          <FormField label="Специализация">
            <Input value={item.specialization} onValueChange={(value) => onChange(item.draftKey, "specialization", value)} />
          </FormField>
          <FormField label="Описание">
            <Textarea value={item.description} onValueChange={(value) => onChange(item.draftKey, "description", value)} rows={3} autoResize />
          </FormField>
        </div>

        <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--three">
          <FormField label="Год начала">
            <Input value={item.startYear} onValueChange={(value) => onChange(item.draftKey, "startYear", value.replace(/\D/g, "").slice(0, 4))} />
          </FormField>
          <FormField label="Год окончания">
            <Input value={item.graduationYear} onValueChange={(value) => onChange(item.draftKey, "graduationYear", value.replace(/\D/g, "").slice(0, 4))} />
          </FormField>
          <Card className="candidate-project-editor-switch-card">
            <Switch className="candidate-project-editor-switch" checked={item.isCompleted} onChange={(event) => onChange(item.draftKey, "isCompleted", event.target.checked)}>
              <>
                <span className="ui-check__label">Обучение завершено</span>
                <span className="ui-check__hint">Если выключено, карточка считается текущим этапом обучения.</span>
              </>
            </Switch>
          </Card>
        </div>

        <div className="candidate-project-editor-save">
          <Button type="button" onClick={() => onSave(item)} disabled={isBusy}>
            {isBusy ? "Сохраняем..." : item.id ? "Сохранить изменение" : "Добавить образование"}
          </Button>
          {item.id ? (
            <Button type="button" variant="ghost" onClick={() => onDelete(item)} disabled={isBusy}>
              Удалить
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function AchievementCard({ item, busyKey, onChange, onSave, onDelete }) {
  const isBusy = busyKey === item.draftKey;

  return (
    <Card className="candidate-page-panel">
      <div className="candidate-page-stack">
        <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
          <FormField label="Заголовок">
            <Input value={item.title} onValueChange={(value) => onChange(item.draftKey, "title", value)} />
          </FormField>
          <FormField label="Дата">
            <Input value={item.obtainDate} onValueChange={(value) => onChange(item.draftKey, "obtainDate", value)} type="date" />
          </FormField>
        </div>

        <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
          <FormField label="Локация">
            <Input value={item.location} onValueChange={(value) => onChange(item.draftKey, "location", value)} />
          </FormField>
          <FormField label="Описание">
            <Textarea value={item.description} onValueChange={(value) => onChange(item.draftKey, "description", value)} rows={3} autoResize />
          </FormField>
        </div>

        <div className="candidate-project-editor-save">
          <Button type="button" onClick={() => onSave(item)} disabled={isBusy}>
            {isBusy ? "Сохраняем..." : item.id ? "Сохранить изменение" : "Добавить достижение"}
          </Button>
          {item.id ? (
            <Button type="button" variant="ghost" onClick={() => onDelete(item)} disabled={isBusy}>
              Удалить
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function CandidateResumeEditorApp() {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ status: "loading", profile: null, error: null });
  const [profileDraft, setProfileDraft] = useState(createProfileDraft(null));
  const [educationItems, setEducationItems] = useState([]);
  const [achievementItems, setAchievementItems] = useState([]);
  const [profileSave, setProfileSave] = useState({ status: "idle", error: "" });
  const [busyKey, setBusyKey] = useState("");
  const [sectionError, setSectionError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [profile, education, achievements] = await Promise.all([
          getCandidateProfile(controller.signal),
          getCandidateEducation(controller.signal),
          getCandidateAchievements(controller.signal),
        ]);

        setState({ status: "ready", profile, error: null });
        setProfileDraft(createProfileDraft(profile));
        setEducationItems((Array.isArray(education) ? education : []).map(createEducationDraft));
        setAchievementItems((Array.isArray(achievements) ? achievements : []).map(createAchievementDraft));
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          profile: null,
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, [reloadKey]);

  const completion = useMemo(() => {
    let points = 0;
    if (profileDraft.name.trim()) points += 20;
    if (profileDraft.surname.trim()) points += 15;
    if (profileDraft.description.trim()) points += 20;
    if (profileDraft.skills.length) points += 15;
    if (educationItems.length) points += 15;
    if (achievementItems.length) points += 15;
    return Math.min(points, 100);
  }, [achievementItems.length, educationItems.length, profileDraft.description, profileDraft.name, profileDraft.skills.length, profileDraft.surname]);

  function updateProfileField(field, value) {
    setProfileDraft((current) => ({ ...current, [field]: value }));
    setProfileSave((current) => (current.status === "success" ? { status: "idle", error: "" } : current));
  }

  function updateEducationField(draftKey, field, value) {
    setEducationItems((current) =>
      current.map((item) => (item.draftKey === draftKey ? { ...item, [field]: value } : item))
    );
  }

  function updateAchievementField(draftKey, field, value) {
    setAchievementItems((current) =>
      current.map((item) => (item.draftKey === draftKey ? { ...item, [field]: value } : item))
    );
  }

  async function handleProfileSave() {
    if (!profileDraft.name.trim() || !profileDraft.surname.trim()) {
      setProfileSave({
        status: "error",
        error: "Для сохранения профиля укажите имя и фамилию.",
      });
      return;
    }

    setProfileSave({ status: "saving", error: "" });

    try {
      const profile = await updateCandidateProfile({
        name: profileDraft.name.trim(),
        surname: profileDraft.surname.trim(),
        thirdname: profileDraft.thirdname.trim() || null,
        description: profileDraft.description.trim() || null,
        skills: profileDraft.skills,
      });

      setState((current) => ({ ...current, profile }));
      setProfileDraft(createProfileDraft(profile));
      setProfileSave({ status: "success", error: "" });
    } catch (error) {
      setProfileSave({
        status: "error",
        error: error?.message ?? "Не удалось сохранить данные профиля.",
      });
    }
  }

  async function handleEducationSave(item) {
    if (!item.institutionName.trim()) {
      setSectionError("Для записи об образовании нужно указать учебное заведение.");
      return;
    }

    setSectionError("");
    setBusyKey(item.draftKey);

    try {
      const payload = {
        institutionName: item.institutionName.trim(),
        faculty: item.faculty.trim() || null,
        specialization: item.specialization.trim() || null,
        startYear: item.startYear ? Number(item.startYear) : null,
        graduationYear: item.graduationYear ? Number(item.graduationYear) : null,
        isCompleted: item.isCompleted,
        description: item.description.trim() || null,
      };

      if (item.id) {
        await updateCandidateEducation(item.id, payload);
      } else {
        await createCandidateEducation(payload);
      }

      setReloadKey((current) => current + 1);
    } catch (error) {
      setSectionError(error?.message ?? "Не удалось сохранить образование.");
    } finally {
      setBusyKey("");
    }
  }

  async function handleEducationDelete(item) {
    setSectionError("");
    setBusyKey(item.draftKey);

    try {
      await deleteCandidateEducation(item.id);
      setReloadKey((current) => current + 1);
    } catch (error) {
      setSectionError(error?.message ?? "Не удалось удалить образование.");
    } finally {
      setBusyKey("");
    }
  }

  async function handleAchievementSave(item) {
    setSectionError("");
    setBusyKey(item.draftKey);

    try {
      const payload = {
        title: item.title.trim() || null,
        location: item.location.trim() || null,
        description: item.description.trim() || null,
        obtainDate: toUnixSeconds(item.obtainDate),
      };

      if (item.id) {
        await updateCandidateAchievement(item.id, payload);
      } else {
        await createCandidateAchievement(payload);
      }

      setReloadKey((current) => current + 1);
    } catch (error) {
      setSectionError(error?.message ?? "Не удалось сохранить достижение.");
    } finally {
      setBusyKey("");
    }
  }

  async function handleAchievementDelete(item) {
    setSectionError("");
    setBusyKey(item.draftKey);

    try {
      await deleteCandidateAchievement(item.id);
      setReloadKey((current) => current + 1);
    } catch (error) {
      setSectionError(error?.message ?? "Не удалось удалить достижение.");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <section className="candidate-editor-page">
        <div className="candidate-editor-grid">
          <div className="candidate-editor-main">
            <header className="candidate-editor-head">
              <SectionHeader
                eyebrow="Резюме"
                title="Редактор резюме"
                description="Форма работает поверх реальных candidate endpoints: профиль, образование и достижения больше не живут в моках."
                size="lg"
                actions={<Button href={CANDIDATE_PAGE_ROUTES.resume} variant="secondary">Назад к резюме</Button>}
              />
            </header>

            {state.status === "loading" ? <Loader label="Загружаем редактор резюме" surface /> : null}

            {state.status === "unauthorized" ? (
              <Card>
                <EmptyState
                  eyebrow="Доступ ограничен"
                  title="Нужно войти как кандидат"
                  description="Редактор резюме доступен только авторизованному кандидату."
                  tone="warning"
                />
              </Card>
            ) : null}

            {state.status === "error" ? (
              <Alert tone="error" title="Не удалось загрузить редактор" showIcon>
                {state.error?.message ?? "Попробуйте открыть страницу позже."}
              </Alert>
            ) : null}

            {state.status === "ready" ? (
              <>
                <ResumeEditorSection
                  eyebrow="Профиль"
                  title="Основные данные"
                  description="Эти поля синхронизируются с `/api/candidate/me`."
                  actions={
                    <Button type="button" onClick={handleProfileSave} disabled={profileSave.status === "saving"}>
                      {profileSave.status === "saving" ? "Сохраняем..." : "Сохранить профиль"}
                    </Button>
                  }
                >
                  {profileSave.status === "error" ? (
                    <Alert tone="error" title="Профиль не сохранен" showIcon>
                      {profileSave.error}
                    </Alert>
                  ) : null}

                  {profileSave.status === "success" ? (
                    <Alert tone="success" title="Профиль обновлен" showIcon>
                      Новые данные уже используются в кабинете кандидата.
                    </Alert>
                  ) : null}

                  <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                    <FormField label="Имя" required>
                      <Input value={profileDraft.name} onValueChange={(value) => updateProfileField("name", value)} />
                    </FormField>
                    <FormField label="Фамилия" required>
                      <Input value={profileDraft.surname} onValueChange={(value) => updateProfileField("surname", value)} />
                    </FormField>
                  </div>

                  <FormField label="Отчество">
                    <Input value={profileDraft.thirdname} onValueChange={(value) => updateProfileField("thirdname", value)} />
                  </FormField>

                  <FormField label="О себе">
                    <Textarea value={profileDraft.description} onValueChange={(value) => updateProfileField("description", value)} rows={5} autoResize />
                  </FormField>

                  <TagSelector
                    className="candidate-project-editor-tag-selector"
                    title="Навыки"
                    value={profileDraft.skills}
                    suggestions={CANDIDATE_SKILL_SUGGESTIONS}
                    suggestionsLabel="Подсказки"
                    searchPlaceholder="Поиск навыков"
                    clearLabel="Очистить поиск"
                    saveLabel="Сохранить навыки"
                    onSave={(nextSkills) => updateProfileField("skills", nextSkills)}
                  />
                </ResumeEditorSection>

                <ResumeEditorSection
                  eyebrow="Образование"
                  title="Образование"
                  description="Записи сохраняются через `/api/candidate/me/education`."
                  actions={
                    <Button type="button" variant="secondary" onClick={() => setEducationItems((current) => [...current, createEducationDraft()])}>
                      Добавить образование
                    </Button>
                  }
                >
                  {sectionError ? (
                    <Alert tone="error" title="Операция не выполнена" showIcon>
                      {sectionError}
                    </Alert>
                  ) : null}

                  {educationItems.length ? (
                    educationItems.map((item) => (
                      <EducationCard
                        key={item.draftKey}
                        item={item}
                        busyKey={busyKey}
                        onChange={updateEducationField}
                        onSave={handleEducationSave}
                        onDelete={handleEducationDelete}
                      />
                    ))
                  ) : (
                    <EmptyState
                      title="Пока нет записей об образовании"
                      description="Добавьте первую запись прямо из редактора."
                      tone="neutral"
                      compact
                    />
                  )}
                </ResumeEditorSection>

                <ResumeEditorSection
                  eyebrow="Достижения"
                  title="Достижения"
                  description="Раздел подключен к `/api/candidate/me/achievements`."
                  actions={
                    <Button type="button" variant="secondary" onClick={() => setAchievementItems((current) => [...current, createAchievementDraft()])}>
                      Добавить достижение
                    </Button>
                  }
                >
                  {achievementItems.length ? (
                    achievementItems.map((item) => (
                      <AchievementCard
                        key={item.draftKey}
                        item={item}
                        busyKey={busyKey}
                        onChange={updateAchievementField}
                        onSave={handleAchievementSave}
                        onDelete={handleAchievementDelete}
                      />
                    ))
                  ) : (
                    <EmptyState
                      title="Пока нет достижений"
                      description="После первых записей они начнут отображаться и в резюме, и в overview."
                      tone="neutral"
                      compact
                    />
                  )}
                </ResumeEditorSection>
              </>
            ) : null}
          </div>

          <aside className="candidate-editor-aside">
            <Card className="candidate-editor-additions-card">
              <div className="candidate-editor-additions-card__title">Состояние резюме</div>
              <div className="candidate-page-stack">
                <p className="ui-type-body">Заполненность профиля: <strong>{completion}%</strong></p>
                <p className="ui-type-body">Образование: <strong>{educationItems.length}</strong></p>
                <p className="ui-type-body">Достижения: <strong>{achievementItems.length}</strong></p>
              </div>
            </Card>

            <Card className="candidate-editor-additions-card">
              <div className="candidate-editor-additions-card__title">Что реально сохраняется</div>
              <div className="candidate-page-stack">
                <p className="ui-type-body">Профиль кандидата</p>
                <p className="ui-type-body">Образование</p>
                <p className="ui-type-body">Достижения</p>
                <p className="ui-type-body">Навыки</p>
              </div>
            </Card>
          </aside>
        </div>
      </section>
  );
}
