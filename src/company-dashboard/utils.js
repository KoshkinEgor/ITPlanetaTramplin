import { getOpportunityApplications } from "../api/company";

import { translateOpportunityType as translateSharedOpportunityType } from "../shared/lib/opportunityTypes";

export const OPPORTUNITY_CONTACT_TYPE_OPTIONS = [
  { value: "phone", label: "Телефон" },
  { value: "email", label: "Email" },
  { value: "link", label: "Ссылка" },
];

export function translateModerationStatus(status) {
  switch (status) {
    case "approved":
      return "Одобрено";
    case "revision":
      return "На доработке";
    case "rejected":
      return "Отклонено";
    default:
      return "На проверке";
  }
}

export function translateVerificationStatus(status) {
  switch (status) {
    case "approved":
      return "Подтверждена";
    case "revision":
      return "Нужна доработка";
    case "rejected":
      return "Отклонена";
    default:
      return "На проверке";
  }
}

export function translateOpportunityType(type) {
  return translateSharedOpportunityType(type);
}

export function translateApplicationStatus(status) {
  switch (status) {
    case "submitted":
      return "Отправлено";
    case "reviewing":
      return "На рассмотрении";
    case "invited":
      return "Приглашение";
    case "accepted":
      return "Принято";
    case "rejected":
      return "Отказ";
    case "withdrawn":
      return "Отозвано";
    default:
      return status || "Статус не указан";
  }
}

export function mapApplicationTone(status) {
  switch (status) {
    case "accepted":
      return "success";
    case "invited":
      return "warning";
    case "rejected":
      return "error";
    default:
      return "info";
  }
}

export function parseTags(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createOpportunityContactDraft(item = null) {
  return {
    type: item?.type === "phone" || item?.type === "email" ? item.type : "link",
    value: item?.value ?? "",
  };
}

export function createOpportunityMediaDraft(item = null) {
  return {
    title: item?.title ?? item?.label ?? "",
    url: item?.url ?? item?.href ?? item?.value ?? "",
  };
}

function normalizeLegacyContactEntries(record) {
  return Object.entries(record ?? {}).map(([key, value]) => {
    const normalizedValue = typeof value === "string" ? value.trim() : "";
    const normalizedKey = String(key ?? "").trim().toLowerCase();

    if (!normalizedValue) {
      return null;
    }

    if (normalizedKey.includes("mail")) {
      return { type: "email", value: normalizedValue };
    }

    if (normalizedKey.includes("phone") || normalizedKey.includes("tel")) {
      return { type: "phone", value: normalizedValue };
    }

    if (normalizedKey.includes("telegram") && !/^https?:\/\//i.test(normalizedValue)) {
      return { type: "link", value: `https://t.me/${normalizedValue.replace(/^@/, "")}` };
    }

    return { type: "link", value: normalizedValue };
  }).filter(Boolean);
}

export function normalizeOpportunityContacts(value) {
  if (!value) {
    return [createOpportunityContactDraft()];
  }

  let parsedValue = value;

  if (typeof value === "string") {
    try {
      parsedValue = JSON.parse(value);
    } catch {
      return [createOpportunityContactDraft()];
    }
  }

  const items = Array.isArray(parsedValue)
    ? parsedValue
    : parsedValue && typeof parsedValue === "object"
      ? normalizeLegacyContactEntries(parsedValue)
      : [];

  const normalized = items
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const type = item.type === "phone" || item.type === "email" ? item.type : "link";
      const contactValue = typeof item.value === "string" ? item.value.trim() : "";

      if (!contactValue) {
        return null;
      }

      return { type, value: contactValue };
    })
    .filter(Boolean);

  return normalized.length ? normalized : [createOpportunityContactDraft()];
}

export function serializeOpportunityContacts(value) {
  const normalized = normalizeOpportunityContacts(value)
    .map((item) => ({
      type: item.type,
      value: String(item.value ?? "").trim(),
    }))
    .filter((item) => item.value);

  return JSON.stringify(normalized);
}

export function normalizeOpportunityMedia(value) {
  if (!value) {
    return [createOpportunityMediaDraft()];
  }

  let parsedValue = value;

  if (typeof value === "string") {
    try {
      parsedValue = JSON.parse(value);
    } catch {
      return [createOpportunityMediaDraft()];
    }
  }

  const items = Array.isArray(parsedValue) ? parsedValue : [];
  const normalized = items
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const title = String(item.title ?? item.label ?? "").trim();
      const url = String(item.url ?? item.href ?? item.value ?? "").trim();

      if (!title && !url) {
        return null;
      }

      return { title, url };
    })
    .filter(Boolean);

  return normalized.length ? normalized : [createOpportunityMediaDraft()];
}

export function serializeOpportunityMedia(value) {
  const normalized = normalizeOpportunityMedia(value)
    .map((item) => ({
      title: String(item.title ?? "").trim(),
      url: String(item.url ?? "").trim(),
    }))
    .filter((item) => item.title || item.url);

  return JSON.stringify(normalized);
}

export function formatOpportunityDeadlineInput(value) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export function parseOpportunityDeadlineInput(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return null;
  }

  const [year, month, day] = normalized.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return Math.floor(Date.UTC(year, month - 1, day) / 1000);
}

function formatCoordinateInput(value) {
  if (typeof value !== "number" && typeof value !== "string") {
    return "";
  }

  const normalized = String(value).trim();
  return normalized;
}

export function parseOpportunityCoordinateInput(value) {
  const normalized = String(value ?? "").trim().replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
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
    latitude: formatCoordinateInput(item?.latitude),
    longitude: formatCoordinateInput(item?.longitude),
    expireAt: formatOpportunityDeadlineInput(item?.expireAt ?? null),
    contacts: normalizeOpportunityContacts(item?.contactsJson ?? null),
    media: normalizeOpportunityMedia(item?.mediaContentJson ?? null),
    tags: Array.isArray(item?.tags) ? item.tags.join(", ") : "",
  };
}

export async function loadCompanyApplications(opportunities = [], signal) {
  const lists = await Promise.all(
    opportunities.map(async (item) => {
      const applications = await getOpportunityApplications(item.id, signal);

      return (Array.isArray(applications) ? applications : []).map((application) => ({
        ...application,
        opportunityTitle: item.title,
      }));
    })
  );

  return lists.flat();
}

export function buildCompanySummaryStats({ opportunities = [], applications = [] }) {
  const moderationQueue = opportunities.filter((item) => item.moderationStatus !== "approved").length;

  return [
    { value: String(opportunities.filter((item) => !item.deletedAt).length), label: "Публикации" },
    { value: String(applications.length), label: "Отклики" },
    { value: String(moderationQueue), label: "На проверке" },
  ];
}
