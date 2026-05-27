export const DEMO = {
  "design-ui-ux": {
    id: "design-ui-ux",
    title: "Дизайнер интерфейсов мобильных приложений UI/UX",
    companyName: "White Tiger Soft",
    locationCity: "Москва",
    locationAddress: "Йошкар-Ола",
    opportunityType: "internship",
    employmentType: "hybrid",
    moderationStatus: "approved",
    publishAt: "2026-02-27",
    description: "Стажировка для студентов и junior-специалистов.",
    contactsJson: "{\"email\":\"hello@whitetigersoft.ru\"}",
    mediaContentJson: "[{\"title\":\"Программа стажировки\"}]",
    tags: ["Figma", "UI / UX"],
    employerId: 10,
    applicationsCount: 0,
    salaryFrom: 40000,
    salaryTo: 70000,
    duration: "3 месяца"
  },
  "junior-security-analyst": {
    id: "junior-security-analyst",
    title: "Младший аналитик информационной безопасности",
    companyName: "Shield Ops",
    locationCity: "Москва",
    locationAddress: "Ленинградский проспект 39",
    opportunityType: "vacancy",
    employmentType: "remote",
    moderationStatus: "approved",
    publishAt: "2026-03-10",
    description: "Стартовая позиция для кандидатов без опыта.",
    contactsJson: "{\"email\":\"jobs@shieldops.ru\"}",
    mediaContentJson: "[{\"title\":\"Стартовый трек\"}]",
    tags: ["Junior", "SOC", "SIEM"],
    employerId: 404,
    applicationsCount: 1,
    salaryFrom: 120000,
    salaryTo: 180000
  }
};

export function demoOpportunity(id) {
  return DEMO[String(id)] ?? null;
}

export function demoRelated(id) {
  return Object.values(DEMO).filter((item) => String(item.id) !== String(id)).slice(0, 2);
}
