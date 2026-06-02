function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export const EDUCATION_LEVEL_OPTIONS = [
  { value: "Среднее", label: "Среднее" },
  { value: "Среднее профессиональное", label: "Среднее профессиональное" },
  { value: "Неоконченное высшее", label: "Неоконченное высшее" },
  { value: "Бакалавриат", label: "Высшее (Бакалавриат)" },
  { value: "Магистратура", label: "Высшее (Магистратура)" },
  { value: "Специалитет", label: "Высшее (Специалитет)" },
  { value: "Аспирантура", label: "Аспирантура / Докторантура" },
];

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createDraftKey(item = {}) {
  if (item.id) {
    return `education-${item.id}`;
  }

  return `education-new-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

export function createCandidateEducationDraft(item = {}) {
  return {
    id: item.id ?? null,
    draftKey: item.draftKey ?? createDraftKey(item),
    institutionName: item.institutionName ?? "",
    faculty: item.faculty ?? "",
    specialization: item.specialization ?? "",
    startYear: item.startYear != null ? String(item.startYear) : "",
    graduationYear: item.graduationYear != null ? String(item.graduationYear) : "",
    educationLevel: item.educationLevel ?? "",
  };
}

export function getStoredCandidateEducationItems(onboarding) {
  if (Array.isArray(onboarding?.educations)) {
    return onboarding.educations.filter(isRecord);
  }

  if (isRecord(onboarding?.education)) {
    return [onboarding.education];
  }

  return [];
}

export function createCandidateEducationDraftList(education = [], fallbackEducation = []) {
  const source = Array.isArray(education) && education.length ? education : fallbackEducation;

  if (!source.length) {
    return [createCandidateEducationDraft()];
  }

  return source.map((item) => createCandidateEducationDraft(item));
}

export function isCandidateEducationDraftEmpty(item) {
  if (!item) {
    return true;
  }

  return [
    item.institutionName,
    item.faculty,
    item.specialization,
    item.startYear,
    item.graduationYear,
    item.educationLevel,
  ].every((value) => !normalizeString(value));
}

export function getCandidateEducationDraftErrors(items = [], { requireAtLeastOne = true } = {}) {
  const normalizedItems = Array.isArray(items) ? items : [];
  const activeItems = normalizedItems.filter((item) => !isCandidateEducationDraftEmpty(item));
  const itemErrors = {};

  if (requireAtLeastOne && !activeItems.length) {
    return {
      formError: "Добавьте хотя бы одну запись об образовании.",
      itemErrors,
    };
  }

  normalizedItems.forEach((item, index) => {
    const isEmpty = isCandidateEducationDraftEmpty(item);
    if ((index === 0 && requireAtLeastOne) || !isEmpty) {
      const errors = {};

      if (!normalizeString(item.institutionName)) {
        errors.institutionName = "Укажите учебное заведение.";
      }

      if (item.startYear && !/^\d{4}$/.test(normalizeString(item.startYear))) {
        errors.startYear = "Укажите год в формате YYYY.";
      }

      if (!normalizeString(item.graduationYear)) {
        errors.graduationYear = "Укажите год окончания.";
      } else if (!/^\d{4}$/.test(normalizeString(item.graduationYear))) {
        errors.graduationYear = "Укажите год в формате YYYY.";
      }

      if (item.startYear && item.graduationYear && /^\d{4}$/.test(normalizeString(item.startYear)) && /^\d{4}$/.test(normalizeString(item.graduationYear))) {
        if (Number(item.startYear) > Number(item.graduationYear)) {
          errors.startYear = "Год начала не может быть больше года окончания.";
        }
      }

      if (Object.keys(errors).length) {
        itemErrors[item.draftKey] = errors;
      }
    }
  });

  return {
    formError: Object.keys(itemErrors).length ? "Проверьте заполнение раздела образования." : "",
    itemErrors,
  };
}

export function getActiveCandidateEducationDrafts(items = []) {
  return (Array.isArray(items) ? items : []).filter((item) => !isCandidateEducationDraftEmpty(item));
}

export function buildCandidateEducationLinkItems(items = []) {
  return getActiveCandidateEducationDrafts(items).map((item) => ({
    institutionName: normalizeString(item.institutionName),
    faculty: normalizeString(item.faculty),
    specialization: normalizeString(item.specialization),
    startYear: normalizeString(item.startYear),
    graduationYear: normalizeString(item.graduationYear),
    educationLevel: normalizeString(item.educationLevel),
  }));
}

export function createEducationDraftListAfterRemove(items, draftKey) {
  const nextItems = (Array.isArray(items) ? items : []).filter((item) => item.draftKey !== draftKey);
  return nextItems.length ? nextItems : [createCandidateEducationDraft()];
}
