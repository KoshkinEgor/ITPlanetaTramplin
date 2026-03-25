export function getCandidateDisplayName(profile) {
  if (!profile) {
    return "Кандидат";
  }

  return [profile.name, profile.surname, profile.thirdname].filter(Boolean).join(" ").trim() || "Кандидат";
}

export function getCandidateInitials(profile) {
  const displayName = getCandidateDisplayName(profile);
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "К";
}

export function getCandidateMeta(profile) {
  if (!profile) {
    return "Личный кабинет соискателя";
  }

  if (profile.email) {
    return profile.email;
  }

  return "Личный кабинет соискателя";
}

export function getCandidateSkills(profile) {
  return Array.isArray(profile?.skills) ? profile.skills.filter(Boolean) : [];
}

export function getProfileCompletion(profile, education, achievements, projects) {
  let points = 0;
  const skills = getCandidateSkills(profile);

  if (profile?.name) points += 20;
  if (profile?.description) points += 20;
  if (skills.length) points += 20;
  if (Array.isArray(education) && education.length) points += 15;
  if (Array.isArray(achievements) && achievements.length) points += 10;
  if (Array.isArray(projects) && projects.length) points += 15;

  return Math.min(points, 100);
}

export function formatLongDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export function formatMonthRange(startDate, endDate, isOngoing) {
  const startLabel = formatMonth(startDate);
  const endLabel = isOngoing ? "по настоящее время" : formatMonth(endDate);

  if (!startLabel && !endLabel) {
    return "Сроки не указаны";
  }

  if (!endLabel) {
    return startLabel;
  }

  return `${startLabel} — ${endLabel}`;
}

function formatMonth(value) {
  if (!value) {
    return "";
  }

  const normalized = value.length === 7 ? `${value}-01` : value;
  const parsed = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export function mapCandidateProjectToCard(project) {
  return {
    id: project.id,
    type: project.projectType || "Проект",
    status: project.isOngoing ? "В работе" : `Обновлено ${formatLongDate(project.updatedAt) ?? "недавно"}`,
    statusTone: project.isOngoing ? "warning" : "success",
    title: project.title,
    description: project.shortDescription,
    role: `Роль в проекте: ${project.role}`,
    chips: Array.isArray(project.tags) && project.tags.length ? project.tags.slice(0, 4) : ["Без тегов"],
  };
}

export function mapCandidateApplicationToCard(application) {
  const appliedAtLabel = formatLongDate(application.appliedAt) ?? "Дата неизвестна";
  const typeLabel = translateOpportunityType(application.opportunityType);
  const locationLabel = application.locationCity ? ` · ${application.locationCity}` : "";

  return {
    id: application.id,
    type: typeLabel,
    statusKey: mapApplicationTone(application.status),
    statusLabel: translateApplicationStatus(application.status),
    title: application.opportunityTitle,
    company: `${application.companyName}${locationLabel}`,
    details: [`Дата отклика: ${appliedAtLabel}`],
    description: application.employerNote || "Отклик отправлен через реальный API и отслеживается по текущему статусу.",
    actions: [
      { label: "Подробнее", variant: "secondary" },
    ],
  };
}

export function mapContactToCard(contact) {
  const name = contact.name || contact.email || "Контакт";
  const tags = Array.isArray(contact.skills) ? contact.skills.filter(Boolean).slice(0, 4) : [];

  return {
    id: contact.contactProfileId,
    initials: name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "К",
    name,
    summary: contact.email || "Без email",
    tags: tags.length ? tags : ["Контакт"],
  };
}

export function translateOpportunityType(value) {
  switch (value) {
    case "internship":
      return "Стажировка";
    case "vacancy":
      return "Вакансия";
    case "event":
      return "Мероприятие";
    default:
      return value || "Возможность";
  }
}

export function translateApplicationStatus(value) {
  switch (value) {
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
      return value || "Статус неизвестен";
  }
}

export function mapApplicationTone(value) {
  switch (value) {
    case "accepted":
      return "success";
    case "invited":
      return "warning";
    case "rejected":
      return "error";
    default:
      return "neutral";
  }
}
