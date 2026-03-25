export function createInitialProjectDraft() {
  return {
    title: "",
    projectType: "",
    shortDescription: "",
    organization: "",
    role: "",
    teamSize: "",
    startMonth: "",
    endMonth: "",
    isOngoing: false,
    problem: "",
    contribution: "",
    result: "",
    metrics: "",
    lessonsLearned: "",
    tags: [],
    coverImageUrl: "",
    demoUrl: "",
    repositoryUrl: "",
    designUrl: "",
    caseStudyUrl: "",
    showInPortfolio: true,
  };
}

function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUrl(value) {
  return trimText(value);
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeProjectDraft(draft) {
  const normalizedTags = Array.isArray(draft.tags)
    ? draft.tags.map((tag) => trimText(tag)).filter(Boolean)
    : [];

  return {
    title: trimText(draft.title),
    projectType: trimText(draft.projectType),
    shortDescription: trimText(draft.shortDescription),
    organization: trimText(draft.organization),
    role: trimText(draft.role),
    teamSize: trimText(draft.teamSize),
    startMonth: trimText(draft.startMonth),
    endMonth: trimText(draft.endMonth),
    isOngoing: Boolean(draft.isOngoing),
    problem: trimText(draft.problem),
    contribution: trimText(draft.contribution),
    result: trimText(draft.result),
    metrics: trimText(draft.metrics),
    lessonsLearned: trimText(draft.lessonsLearned),
    tags: normalizedTags,
    coverImageUrl: normalizeUrl(draft.coverImageUrl),
    demoUrl: normalizeUrl(draft.demoUrl),
    repositoryUrl: normalizeUrl(draft.repositoryUrl),
    designUrl: normalizeUrl(draft.designUrl),
    caseStudyUrl: normalizeUrl(draft.caseStudyUrl),
    showInPortfolio: Boolean(draft.showInPortfolio),
  };
}

export function validateProjectDraft(draft) {
  const normalized = normalizeProjectDraft(draft);
  const errors = {};

  if (!normalized.title) {
    errors.title = "Введите название проекта.";
  }

  if (!normalized.projectType) {
    errors.projectType = "Выберите тип проекта.";
  }

  if (!normalized.shortDescription) {
    errors.shortDescription = "Добавьте короткое описание для карточки.";
  }

  if (!normalized.role) {
    errors.role = "Укажите вашу роль в проекте.";
  }

  if (!normalized.startMonth) {
    errors.startMonth = "Укажите дату старта проекта.";
  }

  if (!normalized.isOngoing && !normalized.endMonth) {
    errors.endMonth = "Укажите дату завершения проекта или включите текущий статус.";
  }

  if (!normalized.problem) {
    errors.problem = "Опишите задачу или проблему проекта.";
  }

  if (!normalized.contribution) {
    errors.contribution = "Опишите ваш личный вклад.";
  }

  if (!normalized.result) {
    errors.result = "Опишите итог проекта.";
  }

  if (!normalized.tags.length) {
    errors.tags = "Добавьте хотя бы один тег.";
  }

  if (normalized.teamSize) {
    const parsedTeamSize = Number(normalized.teamSize);
    if (!Number.isInteger(parsedTeamSize) || parsedTeamSize <= 0) {
      errors.teamSize = "Размер команды должен быть положительным числом.";
    }
  }

  [
    ["coverImageUrl", normalized.coverImageUrl],
    ["demoUrl", normalized.demoUrl],
    ["repositoryUrl", normalized.repositoryUrl],
    ["designUrl", normalized.designUrl],
    ["caseStudyUrl", normalized.caseStudyUrl],
  ].forEach(([field, value]) => {
    if (value && !isValidUrl(value)) {
      errors[field] = "Введите корректную ссылку с http:// или https://";
    }
  });

  return { errors, normalized };
}

export function formatProjectUpdatedLabel(updatedAt) {
  const value = updatedAt ? new Date(updatedAt) : new Date();

  if (Number.isNaN(value.getTime())) {
    return "Обновлено недавно";
  }

  const formatted = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);

  return `Обновлено ${formatted}`;
}

export function createProjectPreviewItem(draft) {
  const normalized = normalizeProjectDraft(draft);

  return {
    id: "candidate-project-preview",
    type: normalized.projectType || "Проект",
    status: formatProjectUpdatedLabel(new Date().toISOString()),
    statusTone: "success",
    title: normalized.title || "Название проекта",
    description: normalized.shortDescription || "Короткое описание проекта появится здесь после заполнения формы.",
    role: `Роль в проекте: ${normalized.role || "уточните роль"}`,
    chips: normalized.tags.length ? normalized.tags.slice(0, 4) : ["Добавьте теги"],
  };
}
