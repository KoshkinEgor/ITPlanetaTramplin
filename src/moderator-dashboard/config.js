import { routes } from "../app/routes";

export const HEADER_NAV = [
  { label: "Возможности", href: routes.opportunities.catalog, active: true },
  { label: "Работодатели / Компании", href: routes.company.dashboard },
  { label: "Соискатели", href: routes.candidate.profile },
];

export const SIDEBAR_ITEMS = [
  { key: "dashboard", label: "Дашборд", href: routes.moderator.dashboard },
  { key: "opportunities", label: "Модерация возможностей", href: routes.moderator.opportunities },
  { key: "companies", label: "Верификация компаний", href: routes.moderator.companies },
  { key: "users", label: "Пользователи", href: routes.moderator.users },
  { key: "complaints", label: "Жалобы", href: routes.moderator.complaints },
  { key: "tags-system", label: "Теги и система", href: routes.moderator.tagsSystem },
  { key: "logs", label: "Логи", href: routes.moderator.logs },
  { key: "settings", label: "Настройки", href: routes.moderator.settings },
];

export const MODERATOR_SUMMARY = {
  eyebrow: "Real Data",
  count: "API",
  text: "Модераторские экраны подключены к реальным спискам и решениям, а недостающие разделы существуют как route-backed placeholders.",
};
