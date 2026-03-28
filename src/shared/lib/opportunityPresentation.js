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

export function getOpportunityTypeSummary(item = {}) {
  const type = normalizeOpportunityType(item.opportunityType);

  switch (type) {
    case "vacancy": {
      const salary = formatOpportunitySalaryRange(item.salaryFrom, item.salaryTo);
      return {
        accent: salary || "Зарплата не указана",
        note: item.employmentType ? translateEmploymentType(item.employmentType) : "",
      };
    }
    case "internship": {
      const stipend = formatOpportunitySalaryRange(item.stipendFrom, item.stipendTo);
      return {
        accent: item.isPaid === false ? "Стажировка без оплаты" : stipend || "Стажировка с оплатой не указана",
        note: [item.duration ? `Длительность: ${item.duration}` : "", item.isPaid === false ? "Без оплаты" : ""].filter(Boolean).join(" • "),
      };
    }
    case "event": {
      return {
        accent: formatOpportunityDateTime(item.eventStartAt) || "Дата события не указана",
        note: item.registrationDeadline ? `Регистрация до ${formatOpportunityDateTime(item.registrationDeadline)}` : "",
      };
    }
    case "mentoring": {
      return {
        accent: item.duration ? `Длительность: ${item.duration}` : "Длительность не указана",
        note: [item.meetingFrequency ? `Встречи: ${item.meetingFrequency}` : "", item.seatsCount ? `Мест: ${item.seatsCount}` : ""]
          .filter(Boolean)
          .join(" • "),
      };
    }
    default:
      return {
        accent: translateEmploymentType(item.employmentType) || "",
        note: item.locationCity || "",
      };
  }
}

export function getOpportunityCardPresentation(item = {}) {
  const typeLabel = translateOpportunityType(item.opportunityType);
  const typeSummary = getOpportunityTypeSummary(item);
  const employmentLabel = translateEmploymentType(item.employmentType);
  const status = translateModerationStatus(item.moderationStatus);

  return {
    type: typeLabel,
    title: item.title ?? "",
    meta: [item.companyName, item.locationCity, employmentLabel].filter(Boolean).join(" • "),
    accent: typeSummary.accent,
    note: typeSummary.note,
    status,
    statusTone: getModerationStatusTone(item.moderationStatus),
    chips: Array.isArray(item.tags) ? item.tags.slice(0, 3).filter(Boolean) : [],
  };
}

export function getOpportunityDetailPresentation(item = {}) {
  const typeLabel = translateOpportunityType(item.opportunityType);
  const employmentLabel = translateEmploymentType(item.employmentType);
  const typeSummary = getOpportunityTypeSummary(item);

  return {
    typeLabel,
    employmentLabel,
    statusLabel: translateModerationStatus(item.moderationStatus),
    statusTone: getModerationStatusTone(item.moderationStatus),
    summaryAccent: typeSummary.accent,
    summaryNote: typeSummary.note,
    metaLine: [item.companyName, item.locationCity, employmentLabel].filter(Boolean).join(" • "),
    publicHref: item?.id ? buildOpportunityDetailRoute(item.id) : "",
    previewHref: item?.id ? withSearch(buildOpportunityDetailRoute(item.id), { preview: "public" }) : "",
  };
}

export function getOpportunityMiniCardPresentation(item = {}) {
  const presentation = getOpportunityCardPresentation(item);

  return {
    type: presentation.type,
    title: presentation.title,
    meta: presentation.meta,
    accent: presentation.accent,
    note: presentation.note,
    status: presentation.status,
    statusTone: presentation.statusTone,
    chips: presentation.chips,
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
