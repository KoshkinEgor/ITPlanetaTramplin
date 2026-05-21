import { apiRequest } from "../lib/http";

export const FALLBACK_REFERENCE_CATEGORIES = Object.freeze({
  opportunityTypes: [
    { value: "vacancy", label: "Вакансия" },
    { value: "internship", label: "Стажировка" },
    { value: "event", label: "Мероприятие" },
    { value: "mentoring", label: "Менторская программа" },
  ],
  employmentTypes: [
    { value: "office", label: "Офис" },
    { value: "hybrid", label: "Гибрид" },
    { value: "remote", label: "Удаленно" },
    { value: "online", label: "Онлайн" },
  ],
  opportunityLevels: [
    { value: "no_experience", label: "Без опыта" },
    { value: "junior", label: "Junior" },
    { value: "middle", label: "Middle" },
    { value: "senior", label: "Senior" },
  ],
  experienceLevels: [
    { value: "no_experience", label: "Без опыта" },
    { value: "junior", label: "Junior" },
    { value: "middle", label: "Middle" },
    { value: "senior", label: "Senior" },
    { value: "lead", label: "Lead" },
  ],
  workSchedules: [
    { value: "full_time", label: "Полный день" },
    { value: "part_time", label: "Частичная занятость" },
    { value: "flexible", label: "Гибкий график" },
    { value: "weekends", label: "По выходным" },
    { value: "shift", label: "Сменный график" },
  ],
  complaintReasons: [
    { value: "spam", label: "Спам или мошенничество" },
    { value: "incorrect_data", label: "Некорректная информация" },
    { value: "contacts", label: "Проблема с контактами" },
    { value: "other", label: "Другое" },
  ],
  moderationStatuses: [
    { value: "pending", label: "На проверке" },
    { value: "approved", label: "Одобрено" },
    { value: "revision", label: "На доработке" },
    { value: "rejected", label: "Отклонено" },
    { value: "archived", label: "В архиве" },
  ],
});

export function getSystemReferences(signal) {
  return apiRequest("/system/references", { signal });
}

function normalizeCategory(items, fallback) {
  const source = Array.isArray(items) && items.length ? items : fallback;
  return source
    .map((item) => ({
      value: item.value ?? item.key ?? item.Value ?? item.Key,
      label: item.label ?? item.Label ?? item.value ?? item.key,
      isActive: item.isActive ?? item.IsActive ?? true,
      isSystem: item.isSystem ?? item.IsSystem ?? false,
    }))
    .filter((item) => item.value && item.label);
}

export function normalizeReferenceCategories(payload) {
  const categories = payload?.categories ?? payload?.Categories ?? {};

  return {
    opportunityTypes: normalizeCategory(categories.opportunityTypes ?? categories.OpportunityTypes, FALLBACK_REFERENCE_CATEGORIES.opportunityTypes),
    employmentTypes: normalizeCategory(categories.employmentTypes ?? categories.EmploymentTypes, FALLBACK_REFERENCE_CATEGORIES.employmentTypes),
    opportunityLevels: normalizeCategory(categories.opportunityLevels ?? categories.OpportunityLevels, FALLBACK_REFERENCE_CATEGORIES.opportunityLevels),
    experienceLevels: normalizeCategory(
      categories.experienceLevels ?? categories.ExperienceLevels ?? categories.opportunityLevels ?? categories.OpportunityLevels,
      FALLBACK_REFERENCE_CATEGORIES.experienceLevels
    ),
    workSchedules: normalizeCategory(categories.workSchedules ?? categories.WorkSchedules, FALLBACK_REFERENCE_CATEGORIES.workSchedules),
    complaintReasons: normalizeCategory(categories.complaintReasons ?? categories.ComplaintReasons, FALLBACK_REFERENCE_CATEGORIES.complaintReasons),
    moderationStatuses: normalizeCategory(categories.moderationStatuses ?? categories.ModerationStatuses, FALLBACK_REFERENCE_CATEGORIES.moderationStatuses),
  };
}
