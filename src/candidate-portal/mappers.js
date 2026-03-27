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

export function getCandidateAvatarUrl(profile) {
  const links = isRecord(profile?.links) ? profile.links : {};
  const media = isRecord(links.media) ? links.media : {};

  return normalizeMetaPart(links.avatarUrl)
    || normalizeMetaPart(links.profileImage)
    || normalizeMetaPart(media.avatarUrl)
    || normalizeMetaPart(media.profileImage);
}

export function getCandidateMeta(profile) {
  if (!profile) {
    return "Личный кабинет соискателя";
  }

  const links = isRecord(profile.links) ? profile.links : {};
  const onboarding = isRecord(links.onboarding) ? links.onboarding : {};
  const education = Array.isArray(onboarding.educations) && onboarding.educations.length && isRecord(onboarding.educations[0])
    ? onboarding.educations[0]
    : isRecord(onboarding.education)
      ? onboarding.education
      : {};
  const metaParts = [
    normalizeMetaPart(onboarding.profession),
    normalizeMetaPart(onboarding.city),
    education.graduationYear ? `выпуск ${education.graduationYear}` : "",
  ].filter(Boolean);

  if (metaParts.length) {
    return metaParts.join(" · ");
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
  const status = normalizeStatus(application.status);
  const employmentLabel = translateEmploymentType(application.employmentType);
  const companyMeta = [application.companyName, application.locationCity, employmentLabel].filter(Boolean).join(" · ");

  return {
    id: application.id,
    opportunityId: application.opportunityId,
    status,
    type: typeLabel,
    statusTone: mapApplicationTone(status),
    statusLabel: translateApplicationStatus(status),
    title: application.opportunityTitle,
    company: companyMeta || application.companyName || "Компания",
    details: [`Дата отправления заявки: ${appliedAtLabel}`],
    description: buildApplicationDescription(status, application.employerNote),
    canWithdraw: status === "submitted" || status === "reviewing",
    canConfirm: status === "invited",
    opportunityDeleted: Boolean(application.opportunityDeleted),
    moderationStatus: application.moderationStatus,
  };
}

export function mapContactToCard(contact) {
  const name = contact.name || contact.email || "Контакт";
  const tags = Array.isArray(contact.skills) ? contact.skills.filter(Boolean).slice(0, 4) : [];

  return {
    id: contact.contactProfileId,
    initials: buildInitials(name),
    name,
    summary: contact.email || "Без email",
    tags: tags.length ? tags : ["Контакт"],
  };
}

export function mapContactToPeerCard(contact, candidateSkills = []) {
  const name = contact?.name || contact?.email || "Контакт";
  const contactSkills = Array.isArray(contact?.skills) ? contact.skills.filter(Boolean) : [];
  const candidateSkillSet = new Set(
    (Array.isArray(candidateSkills) ? candidateSkills : [])
      .map(normalizeSkillKey)
      .filter(Boolean)
  );
  const sharedSkills = contactSkills
    .filter((skill) => candidateSkillSet.size === 0 || candidateSkillSet.has(normalizeSkillKey(skill)))
    .slice(0, 3);

  return {
    id: contact?.contactProfileId ?? contact?.id ?? contact?.email ?? contact?.name,
    initials: buildInitials(name),
    name,
    sharedSkills: sharedSkills.length ? sharedSkills : contactSkills.slice(0, 3),
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
  switch (normalizeStatus(value)) {
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
      return "Удалено";
    default:
      return value || "Статус неизвестен";
  }
}

export function mapApplicationTone(value) {
  switch (normalizeStatus(value)) {
    case "submitted":
    case "reviewing":
      return "info";
    case "invited":
      return "lime";
    case "accepted":
      return "success";
    case "rejected":
      return "warning";
    case "withdrawn":
      return "neutral";
    default:
      return "neutral";
  }
}

export function translateEmploymentType(value) {
  switch (normalizeStatus(value)) {
    case "remote":
      return "Удаленно";
    case "hybrid":
    case "online":
      return "онлайн";
    case "office":
    case "onsite":
      return "офис";
    default:
      return value && normalizeStatus(value) !== "unspecified" ? value : "";
  }
}

function buildApplicationDescription(status, employerNote) {
  const note = typeof employerNote === "string" ? employerNote.trim() : "";

  if (note) {
    return note;
  }

  switch (normalizeStatus(status)) {
    case "submitted":
      return "Ваша заявка отправлена, ожидайте ответа от компании.";
    case "reviewing":
      return "Компания рассматривает вашу заявку.";
    case "invited":
      return "Поздравляем! Ваша заявка была принята. Подтвердите ваше участие.";
    case "accepted":
      return "Ваше участие подтверждено.";
    case "rejected":
      return "Компания завершила рассмотрение отклика.";
    case "withdrawn":
      return "Вы отменили отклик.";
    default:
      return "Статус отклика обновляется.";
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeMetaPart(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSkillKey(value) {
  return typeof value === "string" ? value.trim().toLowerCase().replace(/ё/g, "е") : "";
}

function normalizeStatus(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function buildInitials(value) {
  return String(value ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "К";
}
