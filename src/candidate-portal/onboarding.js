import { CANDIDATE_SKILL_SUGGESTIONS } from "./config";
import { getCandidateSkills } from "./mappers";

export const CANDIDATE_ONBOARDING_STEPS = [
  { key: "profession", label: "Профессия" },
  { key: "basics", label: "Основная информация" },
  { key: "education", label: "Образование" },
  { key: "skills", label: "Навыки" },
  { key: "experience", label: "Опыт работы" },
  { key: "goal", label: "Цель" },
];

export const CANDIDATE_PROFESSION_OPTIONS = [
  "Начинающий специалист",
  "Администратор",
  "Аналитик",
  "Бухгалтер",
  "Водитель",
  "Врач",
  "Графический дизайнер",
  "Дизайнер интерфейсов",
  "Маркетолог",
  "Менеджер проектов",
  "Разработчик",
  "Тестировщик",
];

export const CANDIDATE_GENDER_OPTIONS = [
  { value: "female", label: "Женский" },
  { value: "male", label: "Мужской" },
  { value: "other", label: "Другой" },
];

export const CANDIDATE_CITY_OPTIONS = [
  "Чебоксары",
  "Москва",
  "Санкт-Петербург",
  "Казань",
  "Нижний Новгород",
  "Екатеринбург",
  "Новосибирск",
];

export const CANDIDATE_CITIZENSHIP_OPTIONS = [
  "Россия",
  "Беларусь",
  "Казахстан",
  "Армения",
  "Киргизия",
  "Другое",
];

export const CANDIDATE_SKILL_OPTIONS = [
  ...CANDIDATE_SKILL_SUGGESTIONS,
  "Motion-design",
  "Дизайн-мышление",
  "Adobe After Effects",
  "Adobe Illustrator",
  "A/B тесты",
  "Photoshop",
  "Sketch",
  "Usability",
];

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
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

export function getCandidateProfileLinks(profile) {
  return toRecord(profile?.links);
}

export function getCandidateOnboardingData(profile) {
  const links = getCandidateProfileLinks(profile);
  return toRecord(links.onboarding);
}

export function createCandidateOnboardingDraft({ profile, education = [] }) {
  const onboarding = getCandidateOnboardingData(profile);
  const primaryEducation = Array.isArray(education) && education.length ? education[0] : null;
  const storedEducation = toRecord(onboarding.education);
  const storedExperience = toRecord(onboarding.experience);

  return {
    profession: normalizeString(onboarding.profession),
    surname: normalizeString(profile?.surname),
    name: normalizeString(profile?.name),
    thirdname: normalizeString(profile?.thirdname),
    gender: normalizeString(onboarding.gender),
    birthDate: normalizeString(onboarding.birthDate),
    phone: normalizeString(onboarding.phone),
    city: normalizeString(onboarding.city),
    citizenship: normalizeString(onboarding.citizenship),
    education: {
      id: primaryEducation?.id ?? null,
      institutionName: normalizeString(primaryEducation?.institutionName) || normalizeString(storedEducation.institutionName),
      faculty: normalizeString(primaryEducation?.faculty) || normalizeString(storedEducation.faculty),
      specialization: normalizeString(primaryEducation?.specialization) || normalizeString(storedEducation.specialization),
      graduationYear:
        primaryEducation?.graduationYear != null
          ? String(primaryEducation.graduationYear)
          : normalizeString(storedEducation.graduationYear),
    },
    skills: normalizeStringArray(getCandidateSkills(profile)),
    experience: {
      company: normalizeString(storedExperience.company),
      role: normalizeString(storedExperience.role),
      summary: normalizeString(storedExperience.summary),
      period: normalizeString(storedExperience.period),
      noExperience: Boolean(storedExperience.noExperience),
    },
    goal: normalizeString(onboarding.goal),
  };
}

export function getCandidateOnboardingStepError(stepKey, draft) {
  if (!draft) {
    return "Не удалось загрузить данные анкеты.";
  }

  switch (stepKey) {
    case "profession":
      return draft.profession ? "" : "Выберите профессию, чтобы перейти к следующему шагу.";
    case "basics":
      if (!draft.surname || !draft.name) {
        return "Укажите имя и фамилию.";
      }

      if (!draft.gender || !draft.birthDate || !draft.phone || !draft.city || !draft.citizenship) {
        return "Заполните пол, дату рождения, телефон, город и гражданство.";
      }

      return "";
    case "education":
      if (!draft.education?.institutionName) {
        return "Укажите учебное заведение.";
      }

      if (!draft.education?.graduationYear || !/^\d{4}$/.test(draft.education.graduationYear)) {
        return "Укажите корректный год окончания.";
      }

      return "";
    case "skills":
      return Array.isArray(draft.skills) && draft.skills.length ? "" : "Добавьте хотя бы один навык.";
    case "experience":
      if (draft.experience?.noExperience) {
        return "";
      }

      if (!draft.experience?.company || !draft.experience?.role || !draft.experience?.period || !draft.experience?.summary) {
        return "Заполните компанию, роль, период и краткое описание опыта или отметьте, что опыта пока нет.";
      }

      return "";
    case "goal":
      return draft.goal ? "" : "Сформулируйте карьерную цель.";
    default:
      return "";
  }
}

export function isCandidateOnboardingDraftComplete(draft) {
  return CANDIDATE_ONBOARDING_STEPS.every((step) => !getCandidateOnboardingStepError(step.key, draft));
}

export function isCandidateOnboardingComplete(profile, education = []) {
  return isCandidateOnboardingDraftComplete(createCandidateOnboardingDraft({ profile, education }));
}

export function getCandidateOnboardingProgress(draft) {
  const completedSteps = CANDIDATE_ONBOARDING_STEPS.filter((step) => !getCandidateOnboardingStepError(step.key, draft)).length;
  return Math.round((completedSteps / CANDIDATE_ONBOARDING_STEPS.length) * 100);
}

export function buildCandidateOnboardingLinks(profile, draft) {
  const currentLinks = getCandidateProfileLinks(profile);
  const currentOnboarding = toRecord(currentLinks.onboarding);

  return {
    ...currentLinks,
    onboarding: {
      ...currentOnboarding,
      profession: normalizeString(draft.profession),
      gender: normalizeString(draft.gender),
      birthDate: normalizeString(draft.birthDate),
      phone: normalizeString(draft.phone),
      city: normalizeString(draft.city),
      citizenship: normalizeString(draft.citizenship),
      education: {
        institutionName: normalizeString(draft.education?.institutionName),
        faculty: normalizeString(draft.education?.faculty),
        specialization: normalizeString(draft.education?.specialization),
        graduationYear: normalizeString(draft.education?.graduationYear),
      },
      experience: {
        company: normalizeString(draft.experience?.company),
        role: normalizeString(draft.experience?.role),
        summary: normalizeString(draft.experience?.summary),
        period: normalizeString(draft.experience?.period),
        noExperience: Boolean(draft.experience?.noExperience),
      },
      goal: normalizeString(draft.goal),
      completedAt: isCandidateOnboardingDraftComplete(draft) ? new Date().toISOString() : null,
    },
  };
}
