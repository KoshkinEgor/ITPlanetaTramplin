import { useMemo, useState } from "react";
import { Button, Card, FormField, Input, SectionHeader, Select, StatusBadge, Switch, TagSelector, Textarea } from "../components/ui";
import { CANDIDATE_PAGE_ROUTES } from "./data";
import {
  PROJECT_TAG_SUGGESTIONS,
  PROJECT_TYPE_OPTIONS,
  appendStoredProject,
  createInitialProjectDraft,
  createProjectPreviewItem,
  createProjectRecord,
  validateProjectDraft,
} from "./project-storage";
import { CandidateProjectCard, CandidateStandaloneFrame } from "./shared";

function formatMonthLabel(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(`${value}-01T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function getProjectPeriodLabel(draft) {
  const start = formatMonthLabel(draft.startMonth);
  const end = draft.isOngoing ? "по настоящее время" : formatMonthLabel(draft.endMonth);

  if (start && end) {
    return `${start} — ${end}`;
  }

  if (start) {
    return `${start} — дата завершения уточняется`;
  }

  if (draft.isOngoing) {
    return "Проект в работе";
  }

  return "Сроки проекта появятся после заполнения формы";
}

function clearErrorFields(currentErrors, fields) {
  let hasChanges = false;
  const nextErrors = { ...currentErrors };

  fields.forEach((field) => {
    if (field in nextErrors) {
      delete nextErrors[field];
      hasChanges = true;
    }
  });

  return hasChanges ? nextErrors : currentErrors;
}

function ProjectEditorSection({ eyebrow, title, description, children, className }) {
  return (
    <Card className={`candidate-project-editor-card${className ? ` ${className}` : ""}`}>
      <SectionHeader eyebrow={eyebrow} title={title} description={description} size="md" />
      <div className="candidate-project-editor-card__body">{children}</div>
    </Card>
  );
}

function ProjectEditorTagField({ value, error, onSave }) {
  return (
    <div className="candidate-project-editor-tag-field">
      <div className="candidate-project-editor-tag-field__head">
        <span className="ui-label">
          Теги проекта
          <span aria-hidden="true"> *</span>
        </span>
        <span className="ui-hint">Добавьте стек, методы, инструменты и формат работы.</span>
      </div>

      <TagSelector
        className="candidate-project-editor-tag-selector"
        title="Подберите теги проекта"
        value={value}
        suggestions={PROJECT_TAG_SUGGESTIONS}
        suggestionsLabel="Рекомендованные теги"
        searchPlaceholder="Поиск тегов"
        clearLabel="Очистить поиск"
        saveLabel="Сохранить теги"
        onSave={onSave}
      />

      {error ? (
        <span className="ui-error">{error}</span>
      ) : (
        <span className="ui-hint">Теги попадут в карточку проекта и помогут быстрее понять ваш стек.</span>
      )}
    </div>
  );
}

function ProjectEditorPreview({ draft }) {
  const previewItem = useMemo(() => createProjectPreviewItem(draft), [draft]);
  const periodLabel = useMemo(() => getProjectPeriodLabel(draft), [draft]);

  return (
    <div className="candidate-project-editor-aside candidate-editor-aside">
      <Card className="candidate-project-editor-preview-card">
        <SectionHeader
          eyebrow="Предпросмотр"
          title="Как будет выглядеть карточка"
          description="Карточка обновляется по мере заполнения формы."
          size="md"
        />

        <div className="candidate-project-editor-preview-card__body">
          <CandidateProjectCard item={previewItem} />
        </div>
      </Card>

      <Card className="candidate-project-editor-preview-meta">
        <div className="candidate-project-editor-preview-meta__item">
          <span>Период проекта</span>
          <strong>{periodLabel}</strong>
        </div>

        <div className="candidate-project-editor-preview-meta__item">
          <span>Публичность</span>
          <strong>{draft.showInPortfolio ? "Будет отображаться в портфолио" : "Останется скрытым в портфолио"}</strong>
        </div>

        <div className="candidate-project-editor-preview-meta__item">
          <span>Статус</span>
          <StatusBadge tone={draft.isOngoing ? "lime" : "success"}>
            {draft.isOngoing ? "Проект в работе" : "Проект завершён"}
          </StatusBadge>
        </div>
      </Card>
    </div>
  );
}

export function CandidateProjectEditorApp() {
  const [draft, setDraft] = useState(createInitialProjectDraft);
  const [errors, setErrors] = useState({});

  const updateField = (field, value, relatedFields = [field]) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => clearErrorFields(current, relatedFields));
  };

  const handleOngoingChange = (checked) => {
    setDraft((current) => ({
      ...current,
      isOngoing: checked,
      endMonth: checked ? "" : current.endMonth,
    }));
    setErrors((current) => clearErrorFields(current, ["isOngoing", "endMonth"]));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const { errors: validationErrors, normalized } = validateProjectDraft(draft);

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    appendStoredProject(createProjectRecord(normalized));
    window.location.assign(CANDIDATE_PAGE_ROUTES.projects);
  };

  return (
    <CandidateStandaloneFrame>
      <section className="candidate-project-editor-page candidate-editor-page">
        <form className="candidate-project-editor-grid candidate-editor-grid" onSubmit={handleSubmit} noValidate>
          <div className="candidate-project-editor-main candidate-editor-main">
            <header className="candidate-editor-head">
              <SectionHeader
                eyebrow="Портфолио"
                title="Добавить проект"
                description="Соберите полноценный кейс: название, контекст, личный вклад, результат, стек и ссылки на материалы."
                size="lg"
                actions={
                  <Button href={CANDIDATE_PAGE_ROUTES.projects} variant="secondary">
                    Отмена
                  </Button>
                }
              />
            </header>

            <ProjectEditorSection
              eyebrow="Основное"
              title="Карточка проекта"
              description="Эти поля формируют первое впечатление о проекте в портфолио."
            >
              <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                <FormField label="Название проекта" required error={errors.title}>
                  <Input
                    value={draft.title}
                    onValueChange={(value) => updateField("title", value)}
                    placeholder="Например, Исследование onboarding-сценария"
                  />
                </FormField>

                <FormField label="Тип проекта" required error={errors.projectType}>
                  <Select
                    value={draft.projectType}
                    onValueChange={(value) => updateField("projectType", value)}
                    options={PROJECT_TYPE_OPTIONS}
                    placeholder="Выберите тип проекта"
                  />
                </FormField>
              </div>

              <FormField
                label="Краткое описание"
                required
                hint="1–2 предложения, которые сразу объясняют, о чём проект."
                error={errors.shortDescription}
              >
                <Textarea
                  value={draft.shortDescription}
                  onValueChange={(value) => updateField("shortDescription", value)}
                  rows={4}
                  autoResize
                  placeholder="Коротко опишите задачу, подход и результат так, как это увидят в карточке."
                />
              </FormField>

              <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--three">
                <FormField label="Организация / команда" error={errors.organization}>
                  <Input
                    value={draft.organization}
                    onValueChange={(value) => updateField("organization", value)}
                    placeholder="Компания, вуз, клиент или команда"
                  />
                </FormField>

                <FormField label="Роль в проекте" required error={errors.role}>
                  <Input
                    value={draft.role}
                    onValueChange={(value) => updateField("role", value)}
                    placeholder="Например, UX-исследователь"
                  />
                </FormField>

                <FormField label="Размер команды" hint="Если работали в одиночку, оставьте пустым." error={errors.teamSize}>
                  <Input
                    value={draft.teamSize}
                    onValueChange={(value) => updateField("teamSize", value)}
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    placeholder="Например, 4"
                  />
                </FormField>
              </div>
            </ProjectEditorSection>

            <ProjectEditorSection
              eyebrow="Сроки"
              title="Период и видимость"
              description="Укажите временные рамки проекта и решите, нужно ли сразу показывать его в портфолио."
            >
              <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                <FormField label="Старт проекта" required error={errors.startMonth}>
                  <Input
                    value={draft.startMonth}
                    onValueChange={(value) => updateField("startMonth", value)}
                    type="month"
                  />
                </FormField>

                {!draft.isOngoing ? (
                  <FormField label="Завершение проекта" required error={errors.endMonth}>
                    <Input
                      value={draft.endMonth}
                      onValueChange={(value) => updateField("endMonth", value)}
                      type="month"
                    />
                  </FormField>
                ) : (
                  <div className="candidate-project-editor-period-note">
                    <span className="ui-label">Завершение проекта</span>
                    <p className="ui-hint">Поле скрыто, потому что проект отмечен как текущий.</p>
                  </div>
                )}
              </div>

              <div className="candidate-project-editor-switches">
                <Card className="candidate-project-editor-switch-card">
                  <Switch
                    className="candidate-project-editor-switch"
                    checked={draft.isOngoing}
                    onChange={(event) => handleOngoingChange(event.target.checked)}
                  >
                    <>
                      <span className="ui-check__label">Проект ещё в работе</span>
                      <span className="ui-check__hint">Если включено, дата окончания не обязательна.</span>
                    </>
                  </Switch>
                </Card>

                <Card className="candidate-project-editor-switch-card">
                  <Switch
                    className="candidate-project-editor-switch"
                    checked={draft.showInPortfolio}
                    onChange={(event) => updateField("showInPortfolio", event.target.checked, ["showInPortfolio"])}
                  >
                    <>
                      <span className="ui-check__label">Показывать проект в портфолио</span>
                      <span className="ui-check__hint">Если выключить, проект сохранится, но останется скрытым в публичной выдаче.</span>
                    </>
                  </Switch>
                </Card>
              </div>
            </ProjectEditorSection>

            <ProjectEditorSection
              eyebrow="Кейс"
              title="Контекст и результат"
              description="Разложите проект на понятные блоки: задача, ваш вклад и эффект."
            >
              <div className="candidate-project-editor-stack candidate-editor-stack">
                <FormField
                  label="Проблема / задача"
                  required
                  hint="Что именно требовалось улучшить, проверить или запустить."
                  error={errors.problem}
                >
                  <Textarea
                    value={draft.problem}
                    onValueChange={(value) => updateField("problem", value)}
                    rows={4}
                    autoResize
                    placeholder="Опишите исходную проблему, ограничения и ожидания от проекта."
                  />
                </FormField>

                <FormField
                  label="Ваш личный вклад"
                  required
                  hint="Какие шаги, решения и артефакты были именно вашей зоной ответственности."
                  error={errors.contribution}
                >
                  <Textarea
                    value={draft.contribution}
                    onValueChange={(value) => updateField("contribution", value)}
                    rows={4}
                    autoResize
                    placeholder="Расскажите, что вы сделали лично: интервью, анализ, прототипы, презентации, внедрение."
                  />
                </FormField>

                <FormField
                  label="Итог проекта"
                  required
                  hint="Чем завершился проект и какой артефакт или изменение в итоге появилось."
                  error={errors.result}
                >
                  <Textarea
                    value={draft.result}
                    onValueChange={(value) => updateField("result", value)}
                    rows={4}
                    autoResize
                    placeholder="Опишите, что получилось в финале: решение, релиз, отчет, прототип, новый процесс."
                  />
                </FormField>

                <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                  <FormField label="Метрики / эффект" hint="Например, рост конверсии, снижение шага, скорость решения задачи.">
                    <Textarea
                      value={draft.metrics}
                      onValueChange={(value) => updateField("metrics", value)}
                      rows={4}
                      autoResize
                      placeholder="Добавьте цифры, наблюдения или качественный эффект проекта."
                    />
                  </FormField>

                  <FormField label="Что вы вынесли из проекта" hint="Какие навыки укрепились и какие выводы вы сделали.">
                    <Textarea
                      value={draft.lessonsLearned}
                      onValueChange={(value) => updateField("lessonsLearned", value)}
                      rows={4}
                      autoResize
                      placeholder="Коротко опишите lessons learned и следующий шаг развития."
                    />
                  </FormField>
                </div>
              </div>
            </ProjectEditorSection>

            <ProjectEditorSection
              eyebrow="Материалы"
              title="Теги и ссылки"
              description="Привяжите к проекту стек, ссылки на демо, репозиторий, кейс, макеты и обложку."
            >
              <div className="candidate-project-editor-stack candidate-editor-stack">
                <ProjectEditorTagField
                  value={draft.tags}
                  error={errors.tags}
                  onSave={(nextTags) => updateField("tags", nextTags)}
                />

                <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                  <FormField label="Ссылка на демо" error={errors.demoUrl}>
                    <Input
                      value={draft.demoUrl}
                      onValueChange={(value) => updateField("demoUrl", value)}
                      type="url"
                      placeholder="https://..."
                    />
                  </FormField>

                  <FormField label="Ссылка на репозиторий" error={errors.repositoryUrl}>
                    <Input
                      value={draft.repositoryUrl}
                      onValueChange={(value) => updateField("repositoryUrl", value)}
                      type="url"
                      placeholder="https://github.com/..."
                    />
                  </FormField>
                </div>

                <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                  <FormField label="Ссылка на макеты / дизайн" error={errors.designUrl}>
                    <Input
                      value={draft.designUrl}
                      onValueChange={(value) => updateField("designUrl", value)}
                      type="url"
                      placeholder="https://figma.com/..."
                    />
                  </FormField>

                  <FormField label="Ссылка на кейс / презентацию" error={errors.caseStudyUrl}>
                    <Input
                      value={draft.caseStudyUrl}
                      onValueChange={(value) => updateField("caseStudyUrl", value)}
                      type="url"
                      placeholder="https://..."
                    />
                  </FormField>
                </div>

                <FormField label="Ссылка на обложку / скрин проекта" error={errors.coverImageUrl}>
                  <Input
                    value={draft.coverImageUrl}
                    onValueChange={(value) => updateField("coverImageUrl", value)}
                    type="url"
                    placeholder="https://..."
                  />
                </FormField>
              </div>
            </ProjectEditorSection>

            <div className="candidate-project-editor-save candidate-editor-save">
              <Button type="submit">Сохранить проект</Button>
            </div>
          </div>

          <ProjectEditorPreview draft={draft} />
        </form>
      </section>
    </CandidateStandaloneFrame>
  );
}
