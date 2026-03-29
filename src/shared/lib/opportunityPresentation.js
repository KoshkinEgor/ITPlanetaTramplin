import { buildOpportunityDetailRoute, withSearch } from "../../app/routes";
import {
  normalizeOpportunityContacts,
  normalizeOpportunityMedia,
  parseOpportunityCoordinateInput,
  parseOpportunityDeadlineInput,
  parseTags,
  serializeOpportunityContacts,
  serializeOpportunityMedia,
} from "../../company-dashboard/utils";
import { normalizeOpportunityType, translateOpportunityType } from "./opportunityTypes";

const CURRENCY_FORMATTER = new Intl.NumberFormat("ru-RU");
const DATE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const parsed = Number(String(value).replace(/\s+/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? CURRENCY_FORMATTER.format(parsed) : "";
}

export function formatOpportunityDate(value) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return DATE_FORMATTER.format(date);
}

export function formatOpportunityDateTime(value) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export function toDateTimeInputValue(value) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseDateTimeInputValue(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function translateEmploymentType(value) {
  switch (normalize(value)) {
    case "office":
    case "onsite":
    case "on-site":
      return "Офис";
    case "hybrid":
      return "Гибрид";
    case "remote":
      return "Удаленно";
    case "online":
      return "Онлайн";
    case "unspecified":
    case "":
      return "";
    default:
      return String(value ?? "").trim();
  }
}

export function translateModerationStatus(status) {
  switch (normalize(status)) {
    case "approved":
      return "Одобрено";
    case "revision":
      return "На доработке";
    case "rejected":
      return "Отклонено";
    case "archived":
      return "Архивировано";
    case "draft":
      return "Черновик";
    case "pending":
    default:
      return "На проверке";
  }
}

export function getModerationStatusTone(status) {
  switch (normalize(status)) {
    case "approved":
      return "success";
    case "revision":
      return "warning";
    case "rejected":
      return "error";
    case "archived":
      return "neutral";
    case "draft":
      return "accent";
    default:
      return "neutral";
  }
}

export function formatOpportunitySalaryRange(from, to) {
  const normalizedFrom = formatNumber(from);
  const normalizedTo = formatNumber(to);

  if (normalizedFrom && normalizedTo) {
    return `${normalizedFrom}–${normalizedTo} ₽`;
  }

  if (normalizedFrom) {
    return `от ${normalizedFrom} ₽`;
  }

  if (normalizedTo) {
    return `до ${normalizedTo} ₽`;
  }

  return "";
}

const OPPORTUNITY_TYPE_TONE_BY_KEY = Object.freeze({
  vacancy: "blue",
  internship: "green",
  event: "orange",
  mentoring: "teal",
});

export function getOpportunityTypeTone(value) {
  return OPPORTUNITY_TYPE_TONE_BY_KEY[normalizeOpportunityType(value)] ?? "blue";
}

function compactText(value, maxLength = 40) {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function joinSummaryFacts(...facts) {
  return facts
    .map((fact) => String(fact ?? "").trim())
    .filter(Boolean)
    .join(" • ");
}

function formatSeatsCount(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const parsed = Number(String(value).replace(/\s+/g, "").replace(",", "."));

  if (Number.isFinite(parsed)) {
    return new Intl.NumberFormat("ru-RU").format(parsed);
  }

  return String(value).trim();
}

export function getOpportunityTypeSummary(item = {}) {
  const type = normalizeOpportunityType(item.opportunityType);
  const typeTone = getOpportunityTypeTone(type);
  const employmentLabel = translateEmploymentType(item.employmentType);
  const cityLabel = String(item.locationCity ?? "").trim();

  switch (type) {
    case "vacancy": {
      const salary = formatOpportunitySalaryRange(item.salaryFrom, item.salaryTo);

      return {
        typeTone,
        primaryFactLabel: "Зарплата",
        primaryFactValue: salary || "Зарплата не указана",
        secondaryFact: employmentLabel ? `Формат: ${employmentLabel}` : "Формат не указан",
        tertiaryFact: cityLabel ? `Город: ${cityLabel}` : "",
        compactFact: employmentLabel || (cityLabel ? `Город: ${cityLabel}` : "Формат не указан"),
      };
    }
    case "internship": {
      const stipend = formatOpportunitySalaryRange(item.stipendFrom, item.stipendTo);
      const duration = String(item.duration ?? "").trim();
      const primaryFactValue = item.isPaid === false ? "Без оплаты" : stipend || "Стипендия не указана";
      const secondaryFact = duration ? `Длительность: ${duration}` : "Длительность не указана";

      return {
        typeTone,
        primaryFactLabel: item.isPaid === false ? "Оплата" : "Стипендия",
        primaryFactValue,
        secondaryFact,
        tertiaryFact: employmentLabel ? `Формат: ${employmentLabel}` : "",
        compactFact: duration ? compactText(secondaryFact, 34) : employmentLabel || primaryFactValue,
      };
    }
    case "event": {
      const eventStartAt = formatOpportunityDateTime(item.eventStartAt);
      const registrationDeadline = formatOpportunityDateTime(item.registrationDeadline);
      const registrationDate = formatOpportunityDate(item.registrationDeadline);

      return {
        typeTone,
        primaryFactLabel: "Дата и время",
        primaryFactValue: eventStartAt || "Дата и время не указаны",
        secondaryFact: registrationDeadline ? `Регистрация до ${registrationDeadline}` : "Регистрация не указана",
        tertiaryFact: [employmentLabel, cityLabel].filter(Boolean).join(" • "),
        compactFact: registrationDate ? `До ${registrationDate}` : employmentLabel || cityLabel || "Регистрация не указана",
      };
    }
    case "mentoring": {
      const duration = String(item.duration ?? "").trim();
      const meetingFrequency = String(item.meetingFrequency ?? "").trim();
      const seatsCount = formatSeatsCount(item.seatsCount);

      return {
        typeTone,
        primaryFactLabel: "Длительность",
        primaryFactValue: duration || "Длительность не указана",
        secondaryFact: meetingFrequency ? `Встречи: ${meetingFrequency}` : "Частота встреч не указана",
        tertiaryFact: seatsCount ? `Мест: ${seatsCount}` : "Места не указаны",
        compactFact: compactText(
          meetingFrequency ? `Встречи: ${meetingFrequency}` : seatsCount ? `Мест: ${seatsCount}` : "Места не указаны",
          34
        ),
      };
    }
    default:
      return {
        typeTone,
        primaryFactLabel: "Формат",
        primaryFactValue: employmentLabel || "Формат не указан",
        secondaryFact: cityLabel ? `Город: ${cityLabel}` : "",
        tertiaryFact: "",
        compactFact: employmentLabel || cityLabel || "Формат не указан",
      };
  }
}

export function getOpportunityCardPresentation(item = {}) {
  const typeLabel = translateOpportunityType(item.opportunityType);
  const typeSummary = getOpportunityTypeSummary(item);
  const employmentLabel = translateEmploymentType(item.employmentType);
  const status = translateModerationStatus(item.moderationStatus);
  const summaryFacts = [typeSummary.secondaryFact, typeSummary.tertiaryFact].filter(Boolean);

  return {
    typeKey: normalizeOpportunityType(item.opportunityType),
    typeTone: typeSummary.typeTone,
    type: typeLabel,
    title: item.title ?? "",
    meta: [item.companyName, item.locationCity, employmentLabel].filter(Boolean).join(" • "),
    employmentLabel,
    primaryFactLabel: typeSummary.primaryFactLabel,
    primaryFactValue: typeSummary.primaryFactValue,
    secondaryFact: typeSummary.secondaryFact,
    tertiaryFact: typeSummary.tertiaryFact,
    compactFact: typeSummary.compactFact,
    summaryFacts,
    accent: typeSummary.primaryFactValue,
    note: joinSummaryFacts(...summaryFacts),
    status,
    statusTone: getModerationStatusTone(item.moderationStatus),
    chips: Array.isArray(item.tags) ? item.tags.slice(0, 3).filter(Boolean) : [],
  };
}

export function getOpportunityDetailPresentation(item = {}) {
  const presentation = getOpportunityCardPresentation(item);

  return {
    ...presentation,
    typeLabel: presentation.type,
    employmentLabel: presentation.employmentLabel,
    statusLabel: translateModerationStatus(item.moderationStatus),
    statusTone: getModerationStatusTone(item.moderationStatus),
    summaryAccent: presentation.primaryFactValue,
    summaryNote: presentation.note,
    metaLine: [item.companyName, item.locationCity, presentation.employmentLabel].filter(Boolean).join(" • "),
    publicHref: item?.id ? buildOpportunityDetailRoute(item.id) : "",
    previewHref: item?.id ? withSearch(buildOpportunityDetailRoute(item.id), { preview: "public" }) : "",
  };
}

export function getOpportunityMiniCardPresentation(item = {}) {
  const presentation = getOpportunityCardPresentation(item);

  return {
    typeKey: presentation.typeKey,
    typeTone: presentation.typeTone,
    type: presentation.type,
    title: presentation.title,
    meta: presentation.meta,
    primaryFactLabel: presentation.primaryFactLabel,
    primaryFactValue: presentation.primaryFactValue,
    secondaryFact: presentation.secondaryFact,
    tertiaryFact: presentation.tertiaryFact,
    compactFact: presentation.compactFact,
    summaryFacts: presentation.summaryFacts,
    accent: presentation.accent,
    note: presentation.note,
    status: presentation.status,
    statusTone: presentation.statusTone,
    chips: presentation.chips,
  };
}

export function normalizeOpportunityCardItem(item = {}) {
  const source = item && typeof item === "object" ? item : {};
  const derivedPresentation = source.opportunityType ? getOpportunityCardPresentation(source) : {};
  const merged = {
    ...derivedPresentation,
    ...source,
  };
  const chips = Array.isArray(merged.chips) ? merged.chips.filter(Boolean) : [];
  const primaryFactLabel = String(merged.primaryFactLabel ?? merged.valuePrefix ?? merged.accentPrefix ?? "").trim();
  const primaryFactValue = String(merged.primaryFactValue ?? merged.accent ?? "").trim();
  const secondaryFact = String(merged.secondaryFact ?? merged.note ?? "").trim();
  const tertiaryFact = String(merged.tertiaryFact ?? "").trim();
  const summaryFacts = [secondaryFact, tertiaryFact].filter(Boolean);

  return {
    typeKey: merged.typeKey ?? normalizeOpportunityType(merged.opportunityType),
    typeTone: merged.typeTone ?? getOpportunityTypeTone(merged.typeKey ?? merged.opportunityType),
    type: String(merged.type ?? merged.eyebrow ?? "").trim(),
    status: String(merged.status ?? "").trim(),
    statusTone: merged.statusTone ?? merged.tone ?? "neutral",
    title: String(merged.title ?? "").trim(),
    meta: String(merged.meta ?? merged.company ?? "").trim(),
    primaryFactLabel,
    primaryFactValue,
    secondaryFact,
    tertiaryFact,
    compactFact: String(merged.compactFact ?? merged.valueSuffix ?? secondaryFact ?? "").trim(),
    summaryFacts,
    chips,
  };
}

export function getOpportunityOwnerCapabilities(item = {}, { isOwner = false, isModerator = false } = {}) {
  const status = normalize(item.moderationStatus);
  const hasApplications = Number(item.applicationsCount ?? item.responsesCount ?? 0) > 0;
  const canEdit = isOwner || isModerator;
  const canDelete = canEdit && !hasApplications;
  const canPreview = canEdit;
  const canSubmit = isOwner && ["draft", "revision", "rejected", "archived", "approved"].includes(status);
  const canSaveDraft = isOwner && ["draft", "pending", "revision", "rejected", "archived", "approved"].includes(status);
  const canArchive = isOwner && status === "approved";
  const canRestore = isOwner && status === "archived";
  const canViewResponses = isOwner;

  return {
    canEdit,
    canDelete,
    canPreview,
    canSubmit,
    canSaveDraft,
    canArchive,
    canRestore,
    canViewResponses,
    hasApplications,
    status,
  };
}

export function createOpportunityDraft(item = null) {
  return {
    id: item?.id ?? null,
    title: item?.title ?? "",
    description: item?.description ?? "",
    locationCity: item?.locationCity ?? "",
    locationAddress: item?.locationAddress ?? "",
    opportunityType: item?.opportunityType ?? "vacancy",
    employmentType: item?.employmentType ?? "hybrid",
    latitude: item?.latitude ?? "",
    longitude: item?.longitude ?? "",
    expireAt: item?.expireAt ?? "",
    salaryFrom: item?.salaryFrom ?? "",
    salaryTo: item?.salaryTo ?? "",
    isPaid: item?.isPaid ?? true,
    stipendFrom: item?.stipendFrom ?? "",
    stipendTo: item?.stipendTo ?? "",
    duration: item?.duration ?? "",
    eventStartAt: toDateTimeInputValue(item?.eventStartAt ?? null),
    registrationDeadline: toDateTimeInputValue(item?.registrationDeadline ?? null),
    meetingFrequency: item?.meetingFrequency ?? "",
    seatsCount: item?.seatsCount ?? "",
    contacts: normalizeOpportunityContacts(item?.contactsJson ?? null),
    media: normalizeOpportunityMedia(item?.mediaContentJson ?? null),
    tags: Array.isArray(item?.tags) ? item.tags.join(", ") : "",
    moderationStatus: item?.moderationStatus ?? "draft",
    moderationReason: item?.moderationReason ?? "",
    applicationsCount: item?.applicationsCount ?? 0,
  };
}

export function buildOpportunityPayload(draft, { saveMode = "draft" } = {}) {
  return {
    title: String(draft?.title ?? "").trim(),
    description: String(draft?.description ?? "").trim(),
    locationCity: String(draft?.locationCity ?? "").trim() || null,
    locationAddress: String(draft?.locationAddress ?? "").trim() || null,
    opportunityType: draft?.opportunityType ?? "vacancy",
    employmentType: draft?.employmentType ?? "hybrid",
    latitude: parseOpportunityCoordinateInput(draft?.latitude),
    longitude: parseOpportunityCoordinateInput(draft?.longitude),
    expireAt: parseOpportunityDeadlineInput(draft?.expireAt),
    salaryFrom: parseOpportunityCoordinateInput(draft?.salaryFrom),
    salaryTo: parseOpportunityCoordinateInput(draft?.salaryTo),
    isPaid: Boolean(draft?.isPaid),
    stipendFrom: parseOpportunityCoordinateInput(draft?.stipendFrom),
    stipendTo: parseOpportunityCoordinateInput(draft?.stipendTo),
    duration: String(draft?.duration ?? "").trim() || null,
    eventStartAt: parseDateTimeInputValue(draft?.eventStartAt),
    registrationDeadline: parseDateTimeInputValue(draft?.registrationDeadline),
    meetingFrequency: String(draft?.meetingFrequency ?? "").trim() || null,
    seatsCount: parseOpportunityCoordinateInput(draft?.seatsCount),
    contactsJson: serializeOpportunityContacts(draft?.contacts),
    mediaContentJson: serializeOpportunityMedia(draft?.media),
    tags: parseTags(draft?.tags),
    saveMode,
  };
}

export function validateOpportunityDraftForSubmit(draft) {
  const errors = [];
  const type = normalizeOpportunityType(draft?.opportunityType);
  const title = String(draft?.title ?? "").trim();
  const description = String(draft?.description ?? "").trim();
  const salaryFrom = parseOpportunityCoordinateInput(draft?.salaryFrom);
  const salaryTo = parseOpportunityCoordinateInput(draft?.salaryTo);
  const stipendFrom = parseOpportunityCoordinateInput(draft?.stipendFrom);
  const stipendTo = parseOpportunityCoordinateInput(draft?.stipendTo);
  const duration = String(draft?.duration ?? "").trim();
  const eventStartAt = String(draft?.eventStartAt ?? "").trim();
  const registrationDeadline = String(draft?.registrationDeadline ?? "").trim();
  const meetingFrequency = String(draft?.meetingFrequency ?? "").trim();
  const seatsCount = parseOpportunityCoordinateInput(draft?.seatsCount);

  if (!title) {
    errors.push("Укажите название публикации.");
  }

  if (!description) {
    errors.push("Добавьте описание публикации.");
  }

  if (type === "vacancy" && (salaryFrom === null || salaryTo === null)) {
    errors.push("Для вакансии укажите диапазон зарплаты.");
  }

  if (type === "internship") {
    if (draft?.isPaid && (stipendFrom === null || stipendTo === null)) {
      errors.push("Для оплачиваемой стажировки укажите стипендию.");
    }

    if (!duration) {
      errors.push("Для стажировки укажите длительность.");
    }
  }

  if (type === "event") {
    if (!eventStartAt) {
      errors.push("Для мероприятия укажите дату и время.");
    }

    if (!registrationDeadline) {
      errors.push("Для мероприятия укажите дедлайн регистрации.");
    }
  }

  if (type === "mentoring") {
    if (!duration) {
      errors.push("Для менторской программы укажите длительность.");
    }

    if (!meetingFrequency) {
      errors.push("Для менторской программы укажите частоту встреч.");
    }

    if (seatsCount === null) {
      errors.push("Для менторской программы укажите количество мест.");
    }
  }

  return errors;
}

export function buildOpportunityPreviewRoute(opportunityId) {
  return withSearch(buildOpportunityDetailRoute(opportunityId), { preview: "public" });
}
