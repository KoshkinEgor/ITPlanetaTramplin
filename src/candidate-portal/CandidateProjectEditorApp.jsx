import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCandidateProject } from "../api/candidate";
import { Alert, Button, Card, FormField, Input, SectionHeader, Select, StatusBadge, Switch, TagSelector, Textarea } from "../shared/ui";
import { CANDIDATE_PAGE_ROUTES, PROJECT_TAG_SUGGESTIONS, PROJECT_TYPE_OPTIONS } from "./config";
import { createInitialProjectDraft, createProjectPreviewItem, validateProjectDraft } from "./project-storage";
import { CandidateProjectCard } from "./shared";

function ProjectEditorSection({ eyebrow, title, description, children }) {
  return (
    <Card className="candidate-project-editor-card">
      <SectionHeader eyebrow={eyebrow} title={title} description={description} size="md" />
      <div className="candidate-project-editor-card__body">{children}</div>
    </Card>
  );
}

function ProjectEditorPreview({ draft }) {
  const previewItem = useMemo(() => createProjectPreviewItem(draft), [draft]);

  return (
    <div className="candidate-project-editor-aside candidate-editor-aside">
      <Card className="candidate-project-editor-preview-card">
        <SectionHeader
          eyebrow="Предпросмотр"
          title="Карточка проекта"
          description="Превью обновляется по мере заполнения формы."
          size="md"
        />

        <div className="candidate-project-editor-preview-card__body">
          <CandidateProjectCard item={previewItem} />
        </div>
      </Card>

      <Card className="candidate-project-editor-preview-meta">
        <div className="candidate-project-editor-preview-meta__item">
          <span>Публичность</span>
          <strong>{draft.showInPortfolio ? "Будет в портфолио" : "Скрыт из портфолио"}</strong>
        </div>

        <div className="candidate-project-editor-preview-meta__item">
          <span>Статус</span>
          <StatusBadge tone={draft.isOngoing ? "warning" : "success"}>
            {draft.isOngoing ? "Проект в работе" : "Проект завершен"}
          </StatusBadge>
        </div>
      </Card>
    </div>
  );
}

export function CandidateProjectEditorApp() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(createInitialProjectDraft);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!(field in current)) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    const { errors: validationErrors, normalized } = validateProjectDraft(draft);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await createCandidateProject({
        title: normalized.title,
        projectType: normalized.projectType,
        shortDescription: normalized.shortDescription,
        organization: normalized.organization || null,
        role: normalized.role,
        teamSize: normalized.teamSize ? Number(normalized.teamSize) : null,
        startDate: normalized.startMonth,
        endDate: normalized.isOngoing ? null : normalized.endMonth,
        isOngoing: normalized.isOngoing,
        problem: normalized.problem,
        contribution: normalized.contribution,
        result: normalized.result,
        metrics: normalized.metrics || null,
        lessonsLearned: normalized.lessonsLearned || null,
        tags: normalized.tags,
        coverImageUrl: normalized.coverImageUrl || null,
        demoUrl: normalized.demoUrl || null,
        repositoryUrl: normalized.repositoryUrl || null,
        designUrl: normalized.designUrl || null,
        caseStudyUrl: normalized.caseStudyUrl || null,
        showInPortfolio: normalized.showInPortfolio,
      });

      navigate(CANDIDATE_PAGE_ROUTES.projects);
    } catch (error) {
      setSubmitError(error?.message ?? "Не удалось сохранить проект.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="candidate-project-editor-page candidate-editor-page">
        <form className="candidate-project-editor-grid candidate-editor-grid" onSubmit={handleSubmit} noValidate>
          <div className="candidate-project-editor-main candidate-editor-main">
            <header className="candidate-editor-head">
              <SectionHeader
                eyebrow="Портфолио"
                title="Добавить проект"
                description="Данные сохраняются в backend и сразу попадают в кабинет кандидата."
                size="lg"
                actions={<Button href={CANDIDATE_PAGE_ROUTES.projects} variant="secondary">Отмена</Button>}
              />
            </header>

            {submitError ? (
              <Alert tone="error" title="Ошибка сохранения" showIcon>
                {submitError}
              </Alert>
            ) : null}

            <ProjectEditorSection eyebrow="Основное" title="Карточка проекта" description="Краткие поля для списка проектов.">
              <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                <FormField label="Название проекта" required error={errors.title}>
                  <Input value={draft.title} onValueChange={(value) => updateField("title", value)} placeholder="Название проекта" />
                </FormField>

                <FormField label="Тип проекта" required error={errors.projectType}>
                  <Select value={draft.projectType} onValueChange={(value) => updateField("projectType", value)} options={PROJECT_TYPE_OPTIONS} placeholder="Выберите тип" />
                </FormField>
              </div>

              <FormField label="Краткое описание" required error={errors.shortDescription}>
                <Textarea value={draft.shortDescription} onValueChange={(value) => updateField("shortDescription", value)} rows={4} autoResize />
              </FormField>

              <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--three">
                <FormField label="Организация">
                  <Input value={draft.organization} onValueChange={(value) => updateField("organization", value)} />
                </FormField>
                <FormField label="Роль в проекте" required error={errors.role}>
                  <Input value={draft.role} onValueChange={(value) => updateField("role", value)} />
                </FormField>
                <FormField label="Размер команды" error={errors.teamSize}>
                  <Input value={draft.teamSize} onValueChange={(value) => updateField("teamSize", value)} type="number" min="1" step="1" />
                </FormField>
              </div>
            </ProjectEditorSection>

            <ProjectEditorSection eyebrow="Сроки" title="Период и публикация" description="Укажите временные рамки и публичность проекта.">
              <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                <FormField label="Старт проекта" required error={errors.startMonth}>
                  <Input value={draft.startMonth} onValueChange={(value) => updateField("startMonth", value)} type="month" />
                </FormField>

                {!draft.isOngoing ? (
                  <FormField label="Завершение проекта" required error={errors.endMonth}>
                    <Input value={draft.endMonth} onValueChange={(value) => updateField("endMonth", value)} type="month" />
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
                  <Switch className="candidate-project-editor-switch" checked={draft.isOngoing} onChange={(event) => updateField("isOngoing", event.target.checked)}>
                    <>
                      <span className="ui-check__label">Проект еще в работе</span>
                      <span className="ui-check__hint">Если включено, дата завершения не требуется.</span>
                    </>
                  </Switch>
                </Card>

                <Card className="candidate-project-editor-switch-card">
                  <Switch className="candidate-project-editor-switch" checked={draft.showInPortfolio} onChange={(event) => updateField("showInPortfolio", event.target.checked)}>
                    <>
                      <span className="ui-check__label">Показывать в портфолио</span>
                      <span className="ui-check__hint">Скрытые проекты остаются в кабинете, но не попадают в публичный список.</span>
                    </>
                  </Switch>
                </Card>
              </div>
            </ProjectEditorSection>

            <ProjectEditorSection eyebrow="Кейс" title="Контекст и результат" description="Опишите задачу, вклад и итог.">
              <div className="candidate-project-editor-stack candidate-editor-stack">
                <FormField label="Проблема / задача" required error={errors.problem}>
                  <Textarea value={draft.problem} onValueChange={(value) => updateField("problem", value)} rows={4} autoResize />
                </FormField>

                <FormField label="Ваш вклад" required error={errors.contribution}>
                  <Textarea value={draft.contribution} onValueChange={(value) => updateField("contribution", value)} rows={4} autoResize />
                </FormField>

                <FormField label="Итог проекта" required error={errors.result}>
                  <Textarea value={draft.result} onValueChange={(value) => updateField("result", value)} rows={4} autoResize />
                </FormField>

                <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                  <FormField label="Метрики / эффект">
                    <Textarea value={draft.metrics} onValueChange={(value) => updateField("metrics", value)} rows={4} autoResize />
                  </FormField>

                  <FormField label="Что вы вынесли из проекта">
                    <Textarea value={draft.lessonsLearned} onValueChange={(value) => updateField("lessonsLearned", value)} rows={4} autoResize />
                  </FormField>
                </div>
              </div>
            </ProjectEditorSection>

            <ProjectEditorSection eyebrow="Материалы" title="Теги и ссылки" description="Добавьте стек и ссылки на материалы проекта.">
              <div className="candidate-project-editor-stack candidate-editor-stack">
                <div className="candidate-project-editor-tag-field">
                  <div className="candidate-project-editor-tag-field__head">
                    <span className="ui-label">Теги проекта <span aria-hidden="true">*</span></span>
                    <span className="ui-hint">Стек, инструменты и методы работы.</span>
                  </div>

                  <TagSelector
                    className="candidate-project-editor-tag-selector"
                    title="Подберите теги проекта"
                    value={draft.tags}
                    suggestions={PROJECT_TAG_SUGGESTIONS}
                    suggestionsLabel="Рекомендуемые теги"
                    searchPlaceholder="Поиск тегов"
                    clearLabel="Очистить поиск"
                    saveLabel="Сохранить теги"
                    onSave={(nextTags) => updateField("tags", nextTags)}
                  />

                  {errors.tags ? <span className="ui-error">{errors.tags}</span> : null}
                </div>

                <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                  <FormField label="Ссылка на демо" error={errors.demoUrl}>
                    <Input value={draft.demoUrl} onValueChange={(value) => updateField("demoUrl", value)} type="url" placeholder="https://..." />
                  </FormField>

                  <FormField label="Ссылка на репозиторий" error={errors.repositoryUrl}>
                    <Input value={draft.repositoryUrl} onValueChange={(value) => updateField("repositoryUrl", value)} type="url" placeholder="https://github.com/..." />
                  </FormField>
                </div>

                <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                  <FormField label="Ссылка на дизайн" error={errors.designUrl}>
                    <Input value={draft.designUrl} onValueChange={(value) => updateField("designUrl", value)} type="url" placeholder="https://figma.com/..." />
                  </FormField>

                  <FormField label="Ссылка на кейс" error={errors.caseStudyUrl}>
                    <Input value={draft.caseStudyUrl} onValueChange={(value) => updateField("caseStudyUrl", value)} type="url" placeholder="https://..." />
                  </FormField>
                </div>

                <FormField label="Обложка проекта" error={errors.coverImageUrl}>
                  <Input value={draft.coverImageUrl} onValueChange={(value) => updateField("coverImageUrl", value)} type="url" placeholder="https://..." />
                </FormField>
              </div>
            </ProjectEditorSection>

            <div className="candidate-project-editor-save candidate-editor-save">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Сохраняем..." : "Сохранить проект"}
              </Button>
            </div>
          </div>

          <ProjectEditorPreview draft={draft} />
        </form>
      </section>
  );
}
