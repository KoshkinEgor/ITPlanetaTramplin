import { useEffect, useState } from "react";
import { Button, Card, Input, Tag, TagSelector, Textarea } from "../components/ui";
import { RESUME_EDITOR } from "./data";
import { CandidateProgressCard, CandidateStandaloneFrame } from "./shared";

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m13.9 3.1 3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4.5 15.5 6 11.8l7.7-7.7a1.4 1.4 0 0 1 2 0l.2.2a1.4 1.4 0 0 1 0 2L8.2 14 4.5 15.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M2.5 10s2.8-4.5 7.5-4.5 7.5 4.5 7.5 4.5-2.8 4.5-7.5 4.5S2.5 10 2.5 10Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7.5 10a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="m3 17 14-14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M2.5 10s2.8-4.5 7.5-4.5 7.5 4.5 7.5 4.5-2.8 4.5-7.5 4.5S2.5 10 2.5 10Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7.5 10a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function createInitialResumeState() {
  return {
    ...RESUME_EDITOR,
    additions: [...RESUME_EDITOR.additions],
    visibilityOptions: [...RESUME_EDITOR.visibilityOptions],
    statusOptions: [...RESUME_EDITOR.statusOptions],
    contacts: RESUME_EDITOR.contacts.map((item) => ({ ...item })),
    skills: [...RESUME_EDITOR.skills],
    recommendedSkills: [...RESUME_EDITOR.recommendedSkills],
    summary: { ...RESUME_EDITOR.summary },
    education: { ...RESUME_EDITOR.education },
    about: { ...RESUME_EDITOR.about },
    experience: { ...RESUME_EDITOR.experience },
  };
}

function getUpdatedAtLabel() {
  const formattedDate = new Intl.DateTimeFormat("ru-RU").format(new Date());
  return `Последнее редактирование: ${formattedDate}`;
}

function ResumeEditorFieldCard({ title, value, multiline = false, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <Card className={`candidate-editor-field-card${isEditing ? " is-editing" : ""}`}>
      {isEditing ? (
        <>
          <div className="candidate-editor-field-card__edit">
            <span className="candidate-editor-field-card__label">{title}</span>
            {multiline ? (
              <Textarea value={draft} onValueChange={setDraft} autoResize rows={4} />
            ) : (
              <Input value={draft} onValueChange={setDraft} />
            )}
          </div>

          <div className="candidate-editor-field-card__actions">
            <Button variant="secondary" onClick={() => {
              setDraft(value);
              setIsEditing(false);
            }}>
              Отмена
            </Button>
            <Button onClick={() => {
              onSave(draft);
              setIsEditing(false);
            }}>
              Сохранить
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="candidate-editor-field-card__content">
            <span className="candidate-editor-field-card__label">{title}</span>
            <strong className="candidate-editor-field-card__value">{value}</strong>
          </div>
          <button type="button" className="candidate-editor-icon-button" aria-label={`Редактировать ${title}`} onClick={() => setIsEditing(true)}>
            <PencilIcon />
          </button>
        </>
      )}
    </Card>
  );
}

function ResumeEditorMetaCard({ icon, title, value, tone = "default", onToggle }) {
  return (
    <Card className="candidate-editor-meta-card">
      <div className="candidate-editor-meta-card__body">
        {icon ? (
          <span className="candidate-editor-meta-card__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <div className="candidate-editor-meta-card__copy">
          <span className="candidate-editor-meta-card__title">{title}</span>
          <strong className={`candidate-editor-meta-card__value${tone === "warning" ? " is-warning" : ""}`}>{value}</strong>
        </div>
      </div>
      <button type="button" className="candidate-editor-icon-button" aria-label={`Изменить ${title}`} onClick={onToggle}>
        <PencilIcon />
      </button>
    </Card>
  );
}

function ResumeSummaryCard({ summary, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(summary);

  useEffect(() => {
    setDraft(summary);
  }, [summary]);

  const updateField = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  return (
    <Card className="candidate-editor-summary-card">
      {isEditing ? (
        <div className="candidate-editor-summary-card__form">
          <Input value={draft.title} onValueChange={(value) => updateField("title", value)} placeholder="Название резюме" />
          <Input value={draft.salary} onValueChange={(value) => updateField("salary", value)} placeholder="Ожидаемый доход" />
          <Input value={draft.employment} onValueChange={(value) => updateField("employment", value)} placeholder="Тип занятости" />
          <Input value={draft.format} onValueChange={(value) => updateField("format", value)} placeholder="Формат работы" />
          <Input value={draft.travel} onValueChange={(value) => updateField("travel", value)} placeholder="Командировки" />

          <div className="candidate-editor-field-card__actions">
            <Button variant="secondary" onClick={() => {
              setDraft(summary);
              setIsEditing(false);
            }}>
              Отмена
            </Button>
            <Button onClick={() => {
              onSave({ ...draft, updatedAt: getUpdatedAtLabel() });
              setIsEditing(false);
            }}>
              Сохранить
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="candidate-editor-summary-card__content">
            <div className="candidate-editor-summary-card__copy">
              <h2 className="ui-type-h1">{summary.title}</h2>
              <p className="ui-type-body">{summary.updatedAt}</p>
              <p className="candidate-editor-summary-card__line">{summary.salary}</p>
              <p className="candidate-editor-summary-card__line">{summary.employment}</p>
              <p className="candidate-editor-summary-card__line">{summary.format}</p>
              <p className="candidate-editor-summary-card__line">{summary.travel}</p>
            </div>

            <div className="candidate-editor-summary-card__preview">
              <div className="candidate-editor-summary-card__preview-surface" />
              <button type="button" className="candidate-editor-icon-button" aria-label="Редактировать изображение резюме">
                <PencilIcon />
              </button>
            </div>
          </div>

          <div className="candidate-editor-summary-card__footer">
            <button type="button" className="candidate-editor-text-action" onClick={() => setIsEditing(true)}>
              Редактировать
              <PencilIcon />
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

function ResumeSkillsCard({ skills, recommendedSkills, onSave }) {
  return (
    <TagSelector
      className="candidate-editor-skills-card"
      title="Какими навыками владеете"
      value={skills}
      suggestions={recommendedSkills}
      suggestionsLabel="Рекомендованные навыки"
      searchPlaceholder="Поиск навыков"
      clearLabel="Очистить поиск"
      saveLabel="Сохранить изменения"
      onSave={onSave}
    />
  );
}

function ResumeAside({ resume, onCycleVisibility, onCycleStatus }) {
  const visibilityIcon = resume.visibility === "Видно работодателям" ? <EyeIcon /> : <EyeOffIcon />;

  return (
    <div className="candidate-editor-aside">
      <CandidateProgressCard title="Заполненность резюме" value={resume.completion} />

      <Card className="candidate-editor-additions-card">
        <div className="candidate-editor-additions-card__title">Можете добавить</div>
        <div className="candidate-editor-additions-card__tags">
          {resume.additions.map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
        </div>
      </Card>

      <ResumeEditorMetaCard icon={visibilityIcon} title="Видимость резюме" value={resume.visibility} onToggle={onCycleVisibility} />
      <ResumeEditorMetaCard title="Статус" value={resume.status} tone="warning" onToggle={onCycleStatus} />
    </div>
  );
}

export function CandidateResumeEditorApp() {
  const [resume, setResume] = useState(createInitialResumeState);

  const cycleValue = (currentValue, options) => {
    const index = options.indexOf(currentValue);
    return options[(index + 1) % options.length];
  };

  return (
    <CandidateStandaloneFrame>
      <section className="candidate-editor-page">
        <div className="candidate-editor-grid">
          <div className="candidate-editor-main">
            <header className="candidate-editor-head">
              <h1 className="ui-type-h1">{resume.title}</h1>
            </header>

            <ResumeSummaryCard
              summary={resume.summary}
              onSave={(nextSummary) => setResume((current) => ({ ...current, summary: nextSummary }))}
            />

            <section className="candidate-editor-section">
              <h2 className="ui-type-h2">Контакты</h2>
              <div className="candidate-editor-stack">
                {resume.contacts.map((item) => (
                  <ResumeEditorFieldCard
                    key={item.id}
                    title={item.label}
                    value={item.value}
                    onSave={(nextValue) =>
                      setResume((current) => ({
                        ...current,
                        contacts: current.contacts.map((contact) => (
                          contact.id === item.id ? { ...contact, value: nextValue } : contact
                        )),
                      }))
                    }
                  />
                ))}
              </div>
            </section>

            <section className="candidate-editor-section">
              <h2 className="ui-type-h2">Навыки</h2>
              <ResumeSkillsCard
                skills={resume.skills}
                recommendedSkills={resume.recommendedSkills}
                onSave={(nextSkills) => setResume((current) => ({ ...current, skills: nextSkills }))}
              />
            </section>

            <section className="candidate-editor-section">
              <h2 className="ui-type-h2">Образование</h2>
              <ResumeEditorFieldCard
                title={resume.education.label}
                value={resume.education.value}
                onSave={(nextValue) =>
                  setResume((current) => ({
                    ...current,
                    education: { ...current.education, value: nextValue },
                  }))
                }
              />
            </section>

            <section className="candidate-editor-section">
              <h2 className="ui-type-h2">О себе</h2>
              <ResumeEditorFieldCard
                title={resume.about.label}
                value={resume.about.value}
                multiline
                onSave={(nextValue) =>
                  setResume((current) => ({
                    ...current,
                    about: { ...current.about, value: nextValue },
                  }))
                }
              />
            </section>

            <section className="candidate-editor-section">
              <h2 className="ui-type-h2">Опыт работы</h2>
              <ResumeEditorFieldCard
                title={resume.experience.label}
                value={resume.experience.value}
                multiline
                onSave={(nextValue) =>
                  setResume((current) => ({
                    ...current,
                    experience: { ...current.experience, value: nextValue },
                  }))
                }
              />
            </section>

            <div className="candidate-editor-save">
              <Button onClick={() => setResume((current) => ({
                ...current,
                summary: { ...current.summary, updatedAt: getUpdatedAtLabel() },
              }))}>
                Сохранить изменения
              </Button>
            </div>
          </div>

          <ResumeAside
            resume={resume}
            onCycleVisibility={() => setResume((current) => ({
              ...current,
              visibility: cycleValue(current.visibility, current.visibilityOptions),
            }))}
            onCycleStatus={() => setResume((current) => ({
              ...current,
              status: cycleValue(current.status, current.statusOptions),
            }))}
          />
        </div>
      </section>
    </CandidateStandaloneFrame>
  );
}
