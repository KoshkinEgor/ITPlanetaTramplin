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
  { value: "withdrawn", label: "Отозванные" },
];

export const CANDIDATE_SETTINGS_SECTIONS = [
  {
    id: "settings-profile",
    eyebrow: "Профиль",
    title: "Основные данные",
    summary: "Имя, описание, навыки и ссылки на публичные материалы.",
    status: "Подключено к API",
    statusTone: "success",
    actionLabel: "Редактировать",
  },
  {
    id: "settings-security",
    eyebrow: "Безопасность",
    title: "Почта и восстановление доступа",
    summary: "Email берется из аккаунта, смена пароля идет через отдельный flow восстановления.",
    status: "Без моков",
    statusTone: "success",
    actionLabel: "Открыть",
  },
];
