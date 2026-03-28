import { useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createCandidateProject } from "../api/candidate";
import { Alert, Button, Card, FormField, Input, SectionHeader, Select, StatusBadge, Switch, TagSelector, Textarea } from "../shared/ui";
import { CANDIDATE_PAGE_ROUTES, PROJECT_TAG_SUGGESTIONS, PROJECT_TYPE_OPTIONS } from "./config";
import { CandidatePortfolioProjectCard } from "./portfolio-kit";
import {
  createInitialProjectDraft,
  createProjectParticipantDraft,
  createProjectPreviewItem,
  isProjectImageDataUrl,
  validateProjectDraft,
} from "./project-storage";

const PROJECT_COVER_MAX_SIZE_BYTES = 3 * 1024 * 1024;
const PROJECT_COVER_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";

function ImageUploadIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <path
        d="M19 19.5c0-4.694 3.806-8.5 8.5-8.5h25.86c1.262 0 2.467.53 3.317 1.46l8.14 8.9A4.9 4.9 0 0 1 66 24.64V52.5c0 4.694-3.806 8.5-8.5 8.5h-30c-4.694 0-8.5-3.806-8.5-8.5v-33Z"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path d="M57 11v13h13" stroke="currentColor" strokeWidth="4.5" strokeLinejoin="round" />
      <circle cx="36" cy="33" r="4.5" fill="currentColor" />
      <path d="m24 52 11.2-12a3.2 3.2 0 0 1 4.6-.14L45 45l5.6-5.6a3.2 3.2 0 0 1 4.53 0L61 45.3" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="58" cy="58" r="13" fill="currentColor" opacity="0.14" />
      <path d="M58 50.5v15M50.5 58h15" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

function ProjectEditorSection({ eyebrow, title, description, children }) {
  return (
    <Card className="candidate-project-editor-card">
      <SectionHeader eyebrow={eyebrow} title={title} description={description} size="md" />
      <div className="candidate-project-editor-card__body">{children}</div>
    </Card>
  );
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} КБ`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result) {
        resolve(reader.result);
        return;
      }

      reject(new Error("Не удалось прочитать изображение."));
    };

    reader.onerror = () => {
      reject(new Error("Не удалось прочитать изображение."));
    };

    reader.readAsDataURL(file);
  });
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function createProjectDraftFromSearchParams(searchParams) {
  const initialDraft = createInitialProjectDraft();
  const participantName = normalizeString(searchParams.get("participantName"));
  const participantRole = normalizeString(searchParams.get("participantRole"));

  if (!participantName) {
    return initialDraft;
  }

  return {
    ...initialDraft,
    participants: [
      createProjectParticipantDraft({
        name: participantName,
        role: participantRole,
      }),
    ],
  };
}

function ProjectEditorPreview({ draft }) {
  const previewItem = useMemo(() => createProjectPreviewItem(draft), [draft]);

  return (
    <div className="candidate-project-editor-aside candidate-editor-aside">
      <Card className="candidate-project-editor-preview-card">
        <SectionHeader eyebrow="Портфолио" title="Предварительный вид" size="md" />

        <div className="candidate-project-editor-preview-card__body">
          <CandidatePortfolioProjectCard item={previewItem} actionHref="#candidate-project-preview" />
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

        <div className="candidate-project-editor-preview-meta__item">
          <span>Участники</span>
          <strong>{previewItem.participants.length ? `${previewItem.participants.length} в команде` : "Пока не добавлены"}</strong>
        </div>

        <div className="candidate-project-editor-preview-meta__item">
          <span>Обложка</span>
          <strong>{previewItem.coverImageUrl ? "Изображение добавлено" : "Без изображения"}</strong>
        </div>
      </Card>
    </div>
  );
}

function ProjectCoverUploader({
  value,
  urlValue,
  inputRef,
  isLoading,
  onOpenPicker,
  onFileChange,
  onClear,
  onUrlChange,
}) {
  return (
    <div className="candidate-project-editor-upload">
      <input
        ref={inputRef}
        className="candidate-project-editor-upload__input"
        type="file"
        accept={PROJECT_COVER_ACCEPT}
        onChange={onFileChange}
        aria-label="Загрузить изображение проекта"
      />

      <button type="button" className="candidate-project-editor-upload__surface" onClick={onOpenPicker}>
        {value ? (
          <img src={value} alt="Предпросмотр обложки проекта" />
        ) : (
          <>
            <span className="candidate-project-editor-upload__icon">
              <ImageUploadIcon />
            </span>
            <span className="candidate-project-editor-upload__copy">
              <strong>Добавить изображение</strong>
              <span>Добавьте фото, чтобы карточка проекта стала нагляднее и лучше отражала результат работы.</span>
            </span>
          </>
        )}
      </button>

      <div className="candidate-project-editor-upload__actions">
        <Button type="button" variant={value ? "secondary" : "primary"} onClick={onOpenPicker} disabled={isLoading}>
          {isLoading ? "Загружаем изображение..." : value ? "Заменить изображение" : "Добавить изображение"}
        </Button>

        {value ? (
          <Button type="button" variant="ghost" onClick={onClear} disabled={isLoading}>
            Удалить изображение
          </Button>
        ) : null}
      </div>

      <Input
        value={urlValue}
        onValueChange={onUrlChange}
        type="url"
        placeholder="Или вставьте ссылку на изображение: https://..."
        aria-label="Ссылка на изображение проекта"
      />

      <span className="candidate-project-editor-upload__caption">
        Поддерживаются PNG, JPG, WEBP, GIF и SVG. Максимальный размер файла: {formatFileSize(PROJECT_COVER_MAX_SIZE_BYTES)}.
      </span>
    </div>
  );
}

function ProjectParticipantsEditor({ participants, error, onAdd, onChange, onRemove }) {
  return (
    <div className="candidate-project-editor-participants">
      <div className="candidate-project-editor-participants__head">
        <div className="candidate-project-editor-participants__copy">
          <span className="ui-label">Участники проекта</span>
          <span className="ui-hint">Добавьте ключевых людей команды, чтобы показать масштаб и распределение ролей.</span>
        </div>

        <Button type="button" variant="secondary" onClick={onAdd}>
          Добавить участника
        </Button>
      </div>

      {participants.length ? (
        <div className="candidate-project-editor-participants__list">
          {participants.map((participant) => (
            <div key={participant.draftKey} className="candidate-project-editor-participant">
              <div className="candidate-project-editor-participant__fields">
                <FormField label="Имя участника" required>
                  <Input
                    value={participant.name}
                    onValueChange={(value) => onChange(participant.draftKey, "name", value)}
                    placeholder="Например, Анна Петрова"
                  />
                </FormField>

                <FormField label="Роль в команде">
                  <Input
                    value={participant.role}
                    onValueChange={(value) => onChange(participant.draftKey, "role", value)}
                    placeholder="Дизайн, backend, аналитика..."
                  />
                </FormField>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="candidate-project-editor-participant__remove"
                onClick={() => onRemove(participant.draftKey)}
              >
                Удалить
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="candidate-project-editor-participant">
          <span className="ui-hint">Укажите участников, если проект делался в команде. Поле можно оставить пустым для личного проекта.</span>
        </div>
      )}

      {error ? <span className="ui-error">{error}</span> : null}
    </div>
  );
}

export function CandidateProjectEditorApp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const coverInputRef = useRef(null);
  const [draft, setDraft] = useState(() => createProjectDraftFromSearchParams(searchParams));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingCoverImage, setIsPreparingCoverImage] = useState(false);

  function clearFieldErrors(fields) {
    setErrors((current) => {
      const next = { ...current };
      let hasChanges = false;

      fields.forEach((field) => {
        if (field in next) {
          delete next[field];
          hasChanges = true;
        }
      });

      return hasChanges ? next : current;
    });
  }

  function setFieldError(field, message) {
    setErrors((current) => ({
      ...current,
      [field]: message,
    }));
  }

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    clearFieldErrors([field]);
  }

  function updateParticipants(recipe) {
    setDraft((current) => ({
      ...current,
      participants: typeof recipe === "function" ? recipe(current.participants) : recipe,
    }));
    clearFieldErrors(["participants", "teamSize"]);
  }

  function handleOpenCoverPicker() {
    coverInputRef.current?.click();
  }

  async function handleCoverFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFieldError("coverImageUrl", "Загрузите изображение в формате PNG, JPG, WEBP, GIF или SVG.");
      return;
    }

    if (file.size > PROJECT_COVER_MAX_SIZE_BYTES) {
      setFieldError("coverImageUrl", `Файл слишком большой. Максимальный размер: ${formatFileSize(PROJECT_COVER_MAX_SIZE_BYTES)}.`);
      return;
    }

    try {
      setIsPreparingCoverImage(true);
      const dataUrl = await readFileAsDataUrl(file);
      updateField("coverImageUrl", dataUrl);
    } catch (error) {
      setFieldError("coverImageUrl", error?.message ?? "Не удалось загрузить изображение.");
    } finally {
      setIsPreparingCoverImage(false);
    }
  }

  function handleAddParticipant() {
    updateParticipants((current) => [...current, createProjectParticipantDraft()]);
  }

  function handleParticipantChange(draftKey, field, value) {
    updateParticipants((current) =>
      current.map((participant) => (
        participant.draftKey === draftKey
          ? { ...participant, [field]: value }
          : participant
      ))
    );
  }

  function handleParticipantRemove(draftKey) {
    updateParticipants((current) => current.filter((participant) => participant.draftKey !== draftKey));
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
        participants: normalized.participants.map((participant) => ({
          name: participant.name,
          role: participant.role || null,
        })),
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

  const coverImageUrlInputValue = isProjectImageDataUrl(draft.coverImageUrl) ? "" : draft.coverImageUrl;

  return (
    <section className="candidate-project-editor-page candidate-editor-page">
      <form className="candidate-project-editor-grid candidate-editor-grid" onSubmit={handleSubmit} noValidate>
        <div className="candidate-project-editor-main candidate-editor-main">
          <header className="candidate-editor-head">
            <SectionHeader
              eyebrow="Портфолио"
              title="Проект"
              description="Добавляйте проекты, над которыми вы работали. Расскажите подробно о роли, обязанностях и результате."
              size="lg"
              actions={<Button href={CANDIDATE_PAGE_ROUTES.projects} variant="secondary">Назад к портфолио</Button>}
            />
          </header>

          {submitError ? (
            <Alert tone="error" title="Ошибка сохранения" showIcon>
              {submitError}
            </Alert>
          ) : null}

          <ProjectEditorSection
            eyebrow="Портфолио"
            title="Параметры проекта"
            description="Сделай карточку понятной: тема, дата, формат и ценность для участника."
          >
            <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
              <FormField label="Наименование проекта" required error={errors.title}>
                <Input value={draft.title} onValueChange={(value) => updateField("title", value)} placeholder="Наименование проекта" />
              </FormField>

              <FormField label="Тип проекта" required error={errors.projectType}>
                <Select
                  value={draft.projectType}
                  onValueChange={(value) => updateField("projectType", value)}
                  options={PROJECT_TYPE_OPTIONS}
                  placeholder="Выберите тип"
                />
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

            <ProjectParticipantsEditor
              participants={draft.participants}
              error={errors.participants}
              onAdd={handleAddParticipant}
              onChange={handleParticipantChange}
              onRemove={handleParticipantRemove}
            />
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

          <ProjectEditorSection eyebrow="Материалы" title="Теги, изображение и ссылки" description="Добавьте стек, обложку и ссылки на материалы проекта.">
            <div className="candidate-project-editor-stack candidate-editor-stack">
              <FormField label="Обложка проекта" error={errors.coverImageUrl}>
                <ProjectCoverUploader
                  value={draft.coverImageUrl}
                  urlValue={coverImageUrlInputValue}
                  inputRef={coverInputRef}
                  isLoading={isPreparingCoverImage}
                  onOpenPicker={handleOpenCoverPicker}
                  onFileChange={handleCoverFileChange}
                  onClear={() => updateField("coverImageUrl", "")}
                  onUrlChange={(value) => updateField("coverImageUrl", value)}
                />
              </FormField>

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
            </div>
          </ProjectEditorSection>

          <div className="candidate-project-editor-save candidate-editor-save">
            <Button type="submit" disabled={isSubmitting || isPreparingCoverImage}>
              {isSubmitting ? "Сохраняем..." : "Сохранить проект"}
            </Button>
          </div>
        </div>

        <ProjectEditorPreview draft={draft} />
      </form>
    </section>
  );
}
