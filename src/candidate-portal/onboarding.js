import { CANDIDATE_SKILL_SUGGESTIONS } from "./config";
import {
  buildCandidateEducationLinkItems,
  createCandidateEducationDraftList,
  getCandidateEducationDraftErrors,
  getStoredCandidateEducationItems,
} from "./education";

export const PROFILE_COMPLETION_WARNING_THRESHOLD = 20;

export const CANDIDATE_ONBOARDING_STEPS = [
  { key: "profession", label: "Профессия" },
  { key: "basics", label: "Основная информация" },
  { key: "education", label: "Образование" },
  { key: "skills", label: "Навыки" },
  { key: "experience", label: "Опыт работы" },
  { key: "goal", label: "Цель" },
];

export const CANDIDATE_GENDER_OPTIONS = [
  { value: "female", label: "Женский" },
  { value: "male", label: "Мужской" },
  { value: "other", label: "Другой" },
];

export const CANDIDATE_CITIZENSHIP_OPTIONS = [
  "Россия",
  "Беларусь",
  "Казахстан",
  "Армения",
  "Киргизия",
  "Другое",
];

export const CANDIDATE_SKILL_OPTIONS = Array.from(
  new Set([
    ...CANDIDATE_SKILL_SUGGESTIONS,
    "Motion-design",
    "Дизайн-мышление",
    "Adobe After Effects",
    "Adobe Illustrator",
    "A/B тесты",
    "Photoshop",
    "Sketch",
    "Usability",
  ])
);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMonth(value) {
  const normalized = normalizeString(value);
  return /^\d{4}-\d{2}$/.test(normalized) ? normalized : "";
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toRecord(value) {
  if (isRecord(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return {};
}

function createDraftKey(prefix, id) {
  if (id) {
    return `${prefix}-${id}`;
  }

  return `${prefix}-new-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => normalizeString(item))
        .filter(Boolean)
    )
  );
}

function getCandidateSkillList(profile) {
  return Array.isArray(profile?.skills)
    ? Array.from(new Set(profile.skills.map((item) => normalizeString(item)).filter(Boolean)))
    : [];
}

function formatMonthLabel(value) {
  const normalized = normalizeMonth(value);

  if (!normalized) {
    return "";
  }

  const [year, month] = normalized.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, 1));

  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function buildExperiencePeriodLabel(entry) {
  const startLabel = formatMonthLabel(entry?.startMonth);
  const endLabel = entry?.isCurrent ? "по настоящее время" : formatMonthLabel(entry?.endMonth);

  if (startLabel && endLabel) {
    return `${startLabel} — ${endLabel}`;
  }

  return startLabel || endLabel || normalizeString(entry?.legacyPeriod);
}

export function getCandidateProfileLinks(profile) {
  return toRecord(profile?.links);
}

export function getCandidateOnboardingData(profile) {
  const links = getCandidateProfileLinks(profile);
  return toRecord(links.onboarding);
}

export function getCandidatePrimaryProfession(profile) {
  return normalizeString(getCandidateOnboardingData(profile).profession);
}

export function getCandidateAdditionalProfessions(profile) {
  return normalizeStringArray(getCandidateOnboardingData(profile).additionalProfessions)
    .filter((item) => item !== getCandidatePrimaryProfession(profile));
}

export function getCandidateProfessionTags(profile) {
  return normalizeStringArray([
    getCandidatePrimaryProfession(profile),
    ...getCandidateAdditionalProfessions(profile),
  ]);
}

export function getCandidateLegacyExperience(source) {
  const onboarding = isRecord(source) && "experience" in source
    ? source
    : getCandidateOnboardingData(source);

  const legacyExperience = toRecord(onboarding.experience);

  return {
    company: normalizeString(legacyExperience.company),
    role: normalizeString(legacyExperience.role),
    summary: normalizeString(legacyExperience.summary),
    period: normalizeString(legacyExperience.period),
    noExperience: Boolean(legacyExperience.noExperience || onboarding.noExperience),
  };
}

export function isLegacyCandidateExperienceComplete(value) {
  const experience = getCandidateLegacyExperience({ experience: value });

  if (experience.noExperience) {
    return true;
  }

  return Boolean(experience.company && experience.role && experience.summary && experience.period);
}

export function createCandidateExperienceDraft(item = {}, options = {}) {
  return {
    id: item.id ?? null,
    draftKey: item.draftKey ?? createDraftKey("experience", item.id),
    company: normalizeString(item.company),
    role: normalizeString(item.role),
    summary: normalizeString(item.summary),
    startMonth: normalizeMonth(item.startMonth),
    endMonth: item.isCurrent ? "" : normalizeMonth(item.endMonth),
    isCurrent: Boolean(item.isCurrent),
    legacyPeriod: normalizeString(item.legacyPeriod ?? options.legacyPeriod),
  };
}

export function createEmptyCandidateExperienceDraft() {
  return createCandidateExperienceDraft();
}

export function isCandidateExperienceDraftEmpty(item) {
  if (!item) {
    return true;
  }

  return [
    item.company,
    item.role,
    item.summary,
    item.startMonth,
    item.endMonth,
    item.legacyPeriod,
  ].every((value) => !normalizeString(value)) && !item.isCurrent;
}

export function isCandidateExperienceDraftComplete(item) {
  if (!item) {
    return false;
  }

  return Boolean(
    normalizeString(item.company)
    && normalizeString(item.role)
    && normalizeString(item.summary)
    && normalizeMonth(item.startMonth)
    && (Boolean(item.isCurrent) || normalizeMonth(item.endMonth))
  );
}

export function getActiveCandidateExperienceDrafts(items = []) {
  return (Array.isArray(items) ? items : []).filter((item) => !isCandidateExperienceDraftEmpty(item));
}

export function createExperienceDraftListAfterRemove(items, draftKey) {
  const nextItems = (Array.isArray(items) ? items : []).filter((item) => item.draftKey !== draftKey);
  return nextItems.length ? nextItems : [createEmptyCandidateExperienceDraft()];
}

function createExperienceDraftList(onboarding) {
  const experienceItems = Array.isArray(onboarding?.experiences)
    ? onboarding.experiences.filter(isRecord)
    : [];

  if (experienceItems.length) {
    return experienceItems.map((item) => createCandidateExperienceDraft(item));
  }

  const legacyExperience = getCandidateLegacyExperience(onboarding);

  if (legacyExperience.noExperience || !isLegacyCandidateExperienceComplete(legacyExperience)) {
    return [createEmptyCandidateExperienceDraft()];
  }

  return [
    createCandidateExperienceDraft(
      {
        company: legacyExperience.company,
        role: legacyExperience.role,
        summary: legacyExperience.summary,
      },
      { legacyPeriod: legacyExperience.period }
    ),
  ];
}

function resolveProfileDraft(source, education = []) {
  if (source && Array.isArray(source.educations)) {
    return source;
  }

  return createCandidateOnboardingDraft({
    profile: source,
    education,
  });
}

function hasExperienceData(draft) {
  if (draft?.noExperience) {
    return true;
  }

  if (getActiveCandidateExperienceDrafts(draft?.experiences).some(isCandidateExperienceDraftComplete)) {
    return true;
  }

  return isLegacyCandidateExperienceComplete(draft?.legacyExperience);
}

export function createCandidateOnboardingDraft({ profile, education = [] }) {
  const onboarding = getCandidateOnboardingData(profile);
  const storedEducationItems = getStoredCandidateEducationItems(onboarding);
  const legacyExperience = getCandidateLegacyExperience(onboarding);

  return {
    profession: normalizeString(onboarding.profession),
    additionalProfessions: normalizeStringArray(onboarding.additionalProfessions)
      .filter((item) => item !== normalizeString(onboarding.profession)),
    surname: normalizeString(profile?.surname),
    name: normalizeString(profile?.name),
    thirdname: normalizeString(profile?.thirdname),
    gender: normalizeString(onboarding.gender),
    birthDate: normalizeString(onboarding.birthDate),
    phone: normalizeString(onboarding.phone),
    city: normalizeString(onboarding.city),
    citizenship: normalizeString(onboarding.citizenship),
    educations: createCandidateEducationDraftList(education, storedEducationItems),
    skills: getCandidateSkillList(profile),
    experiences: createExperienceDraftList(onboarding),
    legacyExperience,
    noExperience: Boolean(onboarding.noExperience || legacyExperience.noExperience),
    goal: normalizeString(onboarding.goal),
    skippedAt: normalizeString(onboarding.skippedAt),
    completedAt: normalizeString(onboarding.completedAt),
  };
}

export function getCandidateOnboardingStepError(stepKey, draft) {
  if (!draft) {
    return "Не удалось загрузить данные анкеты.";
  }

  switch (stepKey) {
    case "profession":
      return draft.profession
        ? ""
        : "Выберите основную профессию, чтобы перейти к следующему шагу.";
    case "basics":
      if (!draft.surname || !draft.name) {
        return "Укажите имя и фамилию.";
      }

      if (!draft.gender || !draft.birthDate || !draft.phone || !draft.city || !draft.citizenship) {
        return "Заполните пол, дату рождения, телефон, город и гражданство.";
      }

      return "";
    case "education": {
      const { formError } = getCandidateEducationDraftErrors(draft.educations, { requireAtLeastOne: true });
      return formError;
    }
    case "skills":
      return Array.isArray(draft.skills) && draft.skills.length
        ? ""
        : "Добавьте хотя бы один навык.";
    case "experience":
      return hasExperienceData(draft)
        ? ""
        : "Добавьте хотя бы одно место работы или отметьте, что опыта пока нет.";
    case "goal":
      return draft.goal
        ? ""
        : "Сформулируйте карьерную цель.";
    default:
      return "";
  }
}

export function getCandidateMandatoryCompletion(source, education = []) {
  const draft = resolveProfileDraft(source, education);
  const completedSteps = CANDIDATE_ONBOARDING_STEPS.filter((step) => !getCandidateOnboardingStepError(step.key, draft)).length;
  return Math.round((completedSteps / CANDIDATE_ONBOARDING_STEPS.length) * 100);
}

export function getCandidateOnboardingProgress(source, education = []) {
  return getCandidateMandatoryCompletion(source, education);
}

export function isCandidateOnboardingDraftComplete(draft) {
  return getCandidateMandatoryCompletion(draft) === 100;
}

export function isCandidateOnboardingComplete(profile, education = []) {
  return getCandidateMandatoryCompletion(profile, education) === 100;
}

export function getCandidateOnboardingState(profile, education = []) {
  const onboarding = getCandidateOnboardingData(profile);
  const mandatoryCompletion = getCandidateMandatoryCompletion(profile, education);

  return {
    mandatoryCompletion,
    onboardingComplete: mandatoryCompletion === 100,
    skippedAt: normalizeString(onboarding.skippedAt),
    completedAt: normalizeString(onboarding.completedAt),
    showWarningState: mandatoryCompletion < PROFILE_COMPLETION_WARNING_THRESHOLD,
  };
}

function pickLegacyExperienceSource(experiences) {
  const activeExperienceItems = getActiveCandidateExperienceDrafts(experiences);

  if (!activeExperienceItems.length) {
    return null;
  }

  return activeExperienceItems.find((item) => item.isCurrent)
    ?? activeExperienceItems.find(isCandidateExperienceDraftComplete)
    ?? activeExperienceItems[0];
}

function buildLegacyExperiencePayload(experiences, noExperience, fallbackExperience) {
  if (noExperience) {
    return {
      company: "",
      role: "",
      summary: "",
      period: "",
      noExperience: true,
    };
  }

  const source = pickLegacyExperienceSource(experiences);

  if (!source) {
    return {
      ...getCandidateLegacyExperience({ experience: fallbackExperience }),
      noExperience: false,
    };
  }

  return {
    company: normalizeString(source.company),
    role: normalizeString(source.role),
    summary: normalizeString(source.summary),
    period: buildExperiencePeriodLabel(source),
    noExperience: false,
  };
}

export function getCandidateExperienceItems(profile) {
  const onboarding = getCandidateOnboardingData(profile);
  const experienceItems = Array.isArray(onboarding.experiences)
    ? onboarding.experiences.filter(isRecord).map((item) => createCandidateExperienceDraft(item))
    : [];

  if (experienceItems.length) {
    return experienceItems;
  }

  const legacyExperience = getCandidateLegacyExperience(onboarding);

  if (legacyExperience.noExperience || !isLegacyCandidateExperienceComplete(legacyExperience)) {
    return [];
  }

  return [
    createCandidateExperienceDraft(
      {
        company: legacyExperience.company,
        role: legacyExperience.role,
        summary: legacyExperience.summary,
      },
      { legacyPeriod: legacyExperience.period }
    ),
  ];
}

export function buildCandidateOnboardingLinks(profile, draft, { markSkipped = false } = {}) {
  const currentLinks = getCandidateProfileLinks(profile);
  const currentOnboarding = toRecord(currentLinks.onboarding);
  const educationItems = buildCandidateEducationLinkItems(draft.educations);
  const experiences = getActiveCandidateExperienceDrafts(draft.experiences);
  const onboardingComplete = isCandidateOnboardingDraftComplete(draft);
  const primaryProfession = normalizeString(draft.profession);
  const additionalProfessions = normalizeStringArray(draft.additionalProfessions)
    .filter((item) => item !== primaryProfession);
  const skippedAt = onboardingComplete
    ? null
    : markSkipped
      ? new Date().toISOString()
      : normalizeString(currentOnboarding.skippedAt) || null;
  const completedAt = onboardingComplete
    ? normalizeString(currentOnboarding.completedAt) || new Date().toISOString()
    : null;

  return {
    ...currentLinks,
    onboarding: {
      ...currentOnboarding,
      profession: primaryProfession,
      additionalProfessions,
      gender: normalizeString(draft.gender),
      birthDate: normalizeString(draft.birthDate),
      phone: normalizeString(draft.phone),
      city: normalizeString(draft.city),
      citizenship: normalizeString(draft.citizenship),
      education: educationItems[0] ?? null,
      educations: educationItems,
      experience: buildLegacyExperiencePayload(experiences, Boolean(draft.noExperience), currentOnboarding.experience),
      experiences: draft.noExperience
        ? []
        : experiences.map((item) => ({
          company: normalizeString(item.company),
          role: normalizeString(item.role),
          summary: normalizeString(item.summary),
          startMonth: normalizeMonth(item.startMonth),
          endMonth: item.isCurrent ? "" : normalizeMonth(item.endMonth),
          isCurrent: Boolean(item.isCurrent),
        })),
      noExperience: Boolean(draft.noExperience),
      goal: normalizeString(draft.goal),
      skippedAt,
      completedAt,
    },
  };
}
