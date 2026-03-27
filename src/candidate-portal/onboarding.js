import { CANDIDATE_SKILL_SUGGESTIONS } from "./config";
import {
  buildCandidateEducationLinkItems,
  createCandidateEducationDraftList,
  getCandidateEducationDraftErrors,
  getStoredCandidateEducationItems,
} from "./education";
import { getCandidateSkills } from "./mappers";

export const CANDIDATE_ONBOARDING_STEPS = [
  { key: "profession", label: "РџСЂРѕС„РµСЃСЃРёСЏ" },
  { key: "basics", label: "РћСЃРЅРѕРІРЅР°СЏ РёРЅС„РѕСЂРјР°С†РёСЏ" },
  { key: "education", label: "РћР±СЂР°Р·РѕРІР°РЅРёРµ" },
  { key: "skills", label: "РќР°РІС‹РєРё" },
  { key: "experience", label: "РћРїС‹С‚ СЂР°Р±РѕС‚С‹" },
  { key: "goal", label: "Р¦РµР»СЊ" },
];

export const CANDIDATE_PROFESSION_OPTIONS = [
  "Frontend developer",
  "Backend developer",
  "Fullstack developer",
  "Mobile developer",
  "QA engineer",
  "DevOps engineer",
  "Data analyst",
  "Data engineer",
  "Data scientist",
  "Product manager",
  "Project manager (IT)",
  "System analyst",
  "UI/UX designer",
  "Graphic designer (digital)",
  "Product designer",
  "Cybersecurity specialist",
  "ML engineer",
  "Business analyst (IT)",
  "Technical support specialist",
  "1C developer",
];

export const CANDIDATE_GENDER_OPTIONS = [
  { value: "female", label: "Р–РµРЅСЃРєРёР№" },
  { value: "male", label: "РњСѓР¶СЃРєРѕР№" },
  { value: "other", label: "Р”СЂСѓРіРѕР№" },
];

export const CANDIDATE_CITY_OPTIONS = [
  "Р§РµР±РѕРєСЃР°СЂС‹",
  "РњРѕСЃРєРІР°",
  "РЎР°РЅРєС‚-РџРµС‚РµСЂР±СѓСЂРі",
  "РљР°Р·Р°РЅСЊ",
  "РќРёР¶РЅРёР№ РќРѕРІРіРѕСЂРѕРґ",
  "Р•РєР°С‚РµСЂРёРЅР±СѓСЂРі",
  "РќРѕРІРѕСЃРёР±РёСЂСЃРє",
];

export const CANDIDATE_CITIZENSHIP_OPTIONS = [
  "Р РѕСЃСЃРёСЏ",
  "Р‘РµР»Р°СЂСѓСЃСЊ",
  "РљР°Р·Р°С…СЃС‚Р°РЅ",
  "РђСЂРјРµРЅРёСЏ",
  "РљРёСЂРіРёР·РёСЏ",
  "Р”СЂСѓРіРѕРµ",
];

export const CANDIDATE_SKILL_OPTIONS = [
  ...CANDIDATE_SKILL_SUGGESTIONS,
  "Motion-design",
  "Р”РёР·Р°Р№РЅ-РјС‹С€Р»РµРЅРёРµ",
  "Adobe After Effects",
  "Adobe Illustrator",
  "A/B С‚РµСЃС‚С‹",
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
  const storedEducationItems = getStoredCandidateEducationItems(onboarding);
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
    educations: createCandidateEducationDraftList(education, storedEducationItems),
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
    return "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РґР°РЅРЅС‹Рµ Р°РЅРєРµС‚С‹.";
  }

  switch (stepKey) {
    case "profession":
      return draft.profession ? "" : "Р’С‹Р±РµСЂРёС‚Рµ РїСЂРѕС„РµСЃСЃРёСЋ, С‡С‚РѕР±С‹ РїРµСЂРµР№С‚Рё Рє СЃР»РµРґСѓСЋС‰РµРјСѓ С€Р°РіСѓ.";
    case "basics":
      if (!draft.surname || !draft.name) {
        return "РЈРєР°Р¶РёС‚Рµ РёРјСЏ Рё С„Р°РјРёР»РёСЋ.";
      }

      if (!draft.gender || !draft.birthDate || !draft.phone || !draft.city || !draft.citizenship) {
        return "Р—Р°РїРѕР»РЅРёС‚Рµ РїРѕР», РґР°С‚Сѓ СЂРѕР¶РґРµРЅРёСЏ, С‚РµР»РµС„РѕРЅ, РіРѕСЂРѕРґ Рё РіСЂР°Р¶РґР°РЅСЃС‚РІРѕ.";
      }

      return "";
    case "education": {
      const { formError } = getCandidateEducationDraftErrors(draft.educations, { requireAtLeastOne: true });
      return formError;
    }
    case "skills":
      return Array.isArray(draft.skills) && draft.skills.length ? "" : "Р”РѕР±Р°РІСЊС‚Рµ С…РѕС‚СЏ Р±С‹ РѕРґРёРЅ РЅР°РІС‹Рє.";
    case "experience":
      if (draft.experience?.noExperience) {
        return "";
      }

      if (!draft.experience?.company || !draft.experience?.role || !draft.experience?.period || !draft.experience?.summary) {
        return "Р—Р°РїРѕР»РЅРёС‚Рµ РєРѕРјРїР°РЅРёСЋ, СЂРѕР»СЊ, РїРµСЂРёРѕРґ Рё РєСЂР°С‚РєРѕРµ РѕРїРёСЃР°РЅРёРµ РѕРїС‹С‚Р° РёР»Рё РѕС‚РјРµС‚СЊС‚Рµ, С‡С‚Рѕ РѕРїС‹С‚Р° РїРѕРєР° РЅРµС‚.";
      }

      return "";
    case "goal":
      return draft.goal ? "" : "РЎС„РѕСЂРјСѓР»РёСЂСѓР№С‚Рµ РєР°СЂСЊРµСЂРЅСѓСЋ С†РµР»СЊ.";
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
  const educationItems = buildCandidateEducationLinkItems(draft.educations);

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
      education: educationItems[0] ?? null,
      educations: educationItems,
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

