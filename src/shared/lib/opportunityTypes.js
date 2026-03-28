export const OPPORTUNITY_TYPE_LABELS = Object.freeze({
  vacancy: "Вакансия",
  internship: "Стажировка",
  event: "Мероприятие",
  mentoring: "Менторская программа",
});

export const OPPORTUNITY_TYPE_OPTIONS = Object.freeze(
  Object.entries(OPPORTUNITY_TYPE_LABELS).map(([value, label]) => ({ value, label }))
);

export function normalizeOpportunityType(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function translateOpportunityType(value, fallback = "Возможность") {
  const normalizedValue = normalizeOpportunityType(value);

  if (OPPORTUNITY_TYPE_LABELS[normalizedValue]) {
    return OPPORTUNITY_TYPE_LABELS[normalizedValue];
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return fallback;
}

export function isEventOpportunity(value) {
  return normalizeOpportunityType(value) === "event";
}

export function getOpportunityApplyLabel(value) {
  return isEventOpportunity(value) ? "Подать заявку" : "Откликнуться";
}
