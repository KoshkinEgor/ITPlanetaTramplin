function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

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
    graduationYear: item.graduationYear != null ? String(item.graduationYear) : "",
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
    item.graduationYear,
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

  activeItems.forEach((item) => {
    const errors = {};

    if (!normalizeString(item.institutionName)) {
      errors.institutionName = "Укажите учебное заведение.";
    }

    if (!/^\d{4}$/.test(normalizeString(item.graduationYear))) {
      errors.graduationYear = "Укажите год в формате YYYY.";
    }

    if (Object.keys(errors).length) {
      itemErrors[item.draftKey] = errors;
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
    graduationYear: normalizeString(item.graduationYear),
  }));
}

export function createEducationDraftListAfterRemove(items, draftKey) {
  const nextItems = (Array.isArray(items) ? items : []).filter((item) => item.draftKey !== draftKey);
  return nextItems.length ? nextItems : [createCandidateEducationDraft()];
}
