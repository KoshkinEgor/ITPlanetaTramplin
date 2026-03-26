const MONTH_LABELS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

export const moderatorComplaintActionOptions = [
  { value: "block", label: "Заблокировать", tone: "reject", confirmationButtonLabel: "Заблокировать" },
  { value: "review", label: "Передать на проверку", tone: "revision", confirmationButtonLabel: "Передать" },
  { value: "dismiss", label: "Снять жалобу", tone: "approve", confirmationButtonLabel: "Снять жалобу" },
];

export const moderatorComplaintItems = [
  {
    id: "junior-security-analyst",
    title: "Junior Security Analyst",
    reason: "Недостоверная зарплата",
    createdAt: "2026-03-19",
    description: "Жалобы объединены по одной вакансии: пользователи указывают на некорректную зарплатную вилку в описании.",
    count: 6,
  },
  {
    id: "signal-hub-duplicate",
    title: "Signal Hub HR",
    reason: "Дублирующиеся сообщения кандидатам",
    createdAt: "2026-03-19",
    description: "Группа жалоб на массовые приглашения в отклики без персонализации. Требуется сверка шаблонов рассылки.",
    count: 5,
  },
  {
    id: "signal-hub-spam",
    title: "Signal Hub HR",
    reason: "Спам в откликах",
    createdAt: "2026-03-18",
    description: "Жалобы связаны с массовыми откликами без релевантного сопроводительного текста.",
    count: 4,
  },
  {
    id: "neon-systems-unpaid",
    title: "Neon Systems",
    reason: "Невалидная стажировка",
    createdAt: "2026-03-17",
    description: "Пользователи указывают, что вакансия помечена как стажировка, но по описанию содержит требования middle-уровня и полный график.",
    count: 3,
  },
  {
    id: "orbit-lab-contacts",
    title: "Orbit Lab",
    reason: "Сбор личных контактов вне платформы",
    createdAt: "2026-03-16",
    description: "В описании вакансии размещена просьба отправлять паспортные данные и телефон до отклика через платформу.",
    count: 3,
  },
  {
    id: "quantum-works-misleading",
    title: "Quantum Works",
    reason: "Несоответствие графика",
    createdAt: "2026-03-15",
    description: "Вакансия отмечена как удаленная, но в жалобах кандидаты сообщают о ежедневном обязательном присутствии в офисе.",
    count: 2,
  },
  {
    id: "lighthouse-event-fraud",
    title: "Lighthouse Event Team",
    reason: "Подозрение на мошенничество",
    createdAt: "2026-03-14",
    description: "Несколько репортов указывают на сбор предоплаты за участие в событии. Нужна ручная перепроверка публикации и компании.",
    count: 1,
  },
];

export const moderatorComplaintExamples = moderatorComplaintItems.slice(0, 3);

export function parseComplaintDate(value) {
  if (!value) {
    return null;
  }

  const normalizedValue = String(value).trim();
  if (!normalizedValue) {
    return null;
  }

  const dateOnlyMatch = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
  }

  const parsed = new Date(normalizedValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getComplaintTimestamp(value) {
  return parseComplaintDate(value)?.getTime() ?? 0;
}

export function formatComplaintDate(value) {
  const parsed = parseComplaintDate(value);

  if (!parsed) {
    return "Дата не указана";
  }

  return `${parsed.getDate()} ${MONTH_LABELS[parsed.getMonth()]} ${parsed.getFullYear()}`;
}
