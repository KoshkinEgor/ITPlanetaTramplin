import { getOpportunityApplications } from "../api/company";

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
  switch (type) {
    case "vacancy":
      return "Вакансия";
    case "internship":
      return "Стажировка";
    case "event":
      return "Мероприятие";
    default:
      return type || "Возможность";
  }
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

export function createOpportunityDraft(item = null) {
  return {
    id: item?.id ?? null,
    title: item?.title ?? "",
    description: item?.description ?? "",
    locationCity: item?.locationCity ?? "",
    locationAddress: item?.locationAddress ?? "",
    opportunityType: item?.opportunityType ?? "vacancy",
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
