import { routes } from "../app/routes";

export const CANDIDATE_PAGE_ROUTES = {
  overview: routes.candidate.profile,
  resume: routes.candidate.resume,
  resumeEditor: routes.candidate.resumeEdit,
  projects: routes.candidate.projects,
  projectEditor: routes.candidate.projectEdit,
  responses: routes.candidate.responses,
  contacts: routes.candidate.contacts,
  settings: routes.candidate.settings,
};

export const CANDIDATE_SIDEBAR_ITEMS = [
  { key: "overview", label: "Профиль", href: CANDIDATE_PAGE_ROUTES.overview },
  { key: "portfolio", label: "Портфолио / Резюме", href: CANDIDATE_PAGE_ROUTES.resume },
  { key: "responses", label: "Мои отклики", href: CANDIDATE_PAGE_ROUTES.responses },
  { key: "contacts", label: "Контакты", href: CANDIDATE_PAGE_ROUTES.contacts },
  { key: "settings", label: "Настройки профиля", href: CANDIDATE_PAGE_ROUTES.settings },
];

export const CANDIDATE_PORTFOLIO_TABS = [
  { value: "resume", label: "Резюме", href: CANDIDATE_PAGE_ROUTES.resume },
  { value: "projects", label: "Портфолио", href: CANDIDATE_PAGE_ROUTES.projects },
];

export const PROJECT_TYPE_OPTIONS = [
  { value: "Учебный", label: "Учебный" },
  { value: "Pet-проект", label: "Pet-проект" },
  { value: "Коммерческий", label: "Коммерческий" },
  { value: "Стажировка", label: "Стажировка" },
  { value: "Хакатон", label: "Хакатон" },
  { value: "Волонтерский", label: "Волонтерский" },
];

export const PROJECT_TAG_SUGGESTIONS = [
  "Research",
  "UX",
  "UI",
  "SQL",
  "Python",
  "Analytics",
  "CJM",
  "Figma",
  "FigJam",
  "Prototype",
  "Dashboard",
  "Presentation",
  "A/B",
  "Design System",
  "Interview",
];

export const CANDIDATE_SKILL_SUGGESTIONS = [
  "SQL",
  "Python",
  "JavaScript",
  "React",
  "Figma",
  "UX",
  "UI",
  "Analytics",
  "Data Visualization",
  "Cybersecurity",
  "Product Research",
  "Presentation",
];

export const RESPONSE_FILTERS = [
  { value: "all", label: "Все" },
  { value: "submitted", label: "Отправлено" },
  { value: "reviewing", label: "На рассмотрении" },
  { value: "invited", label: "Приглашение" },
  { value: "accepted", label: "Принятые" },
  { value: "rejected", label: "Отказ" },
  { value: "withdrawn", label: "Удаленные" },
];

export const CANDIDATE_SETTINGS_SECTIONS = [
  {
    id: "settings-profile",
    title: "Личные данные",
    summary: "Имя, профессия, описание, навыки и образование, которые формируют профиль кандидата.",
  },
  {
    id: "settings-contacts",
    title: "Контактная информация",
    summary: "Телефон, почта и публичные ссылки, которые помогают работодателю быстро выйти на связь.",
  },
  {
    id: "settings-security",
    title: "Почта и пароль",
    summary: "Email берется из аккаунта, а смена пароля работает через отдельный защищенный сценарий.",
  },
  {
    id: "settings-privacy",
    title: "Настройки приватности",
    summary: "Управляйте видимостью профиля, контактами и уведомлениями внутри платформы.",
  },
];
