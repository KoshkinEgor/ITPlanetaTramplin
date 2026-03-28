import { PUBLIC_HEADER_NAV_ITEMS, routes } from "../app/routes";

export const HEADER_NAV = PUBLIC_HEADER_NAV_ITEMS;

const BASE_SIDEBAR_ITEMS = [
  { key: "dashboard", label: "Дашборд", href: routes.moderator.dashboard },
  {
    key: "opportunities",
    label: "Модерация возможностей",
    href: routes.moderator.opportunities,
  },
  {
    key: "companies",
    label: "Верификация компаний",
    href: routes.moderator.companies,
  },
  { key: "users", label: "Пользователи", href: routes.moderator.users },
  { key: "complaints", label: "Жалобы", href: routes.moderator.complaints },
  { key: "tags-system", label: "Теги и система", href: routes.moderator.tagsSystem },
  { key: "logs", label: "Логи", href: routes.moderator.logs },
  { key: "settings", label: "Настройки", href: routes.moderator.settings },
];

const ADMIN_ONLY_SIDEBAR_ITEMS = [
  {
    key: "invitations",
    label: "Приглашения модераторов",
    href: routes.moderator.invitations,
  },
];

export function getModeratorSidebarItems(isAdministrator = false) {
  return isAdministrator
    ? [BASE_SIDEBAR_ITEMS[0], ...ADMIN_ONLY_SIDEBAR_ITEMS, ...BASE_SIDEBAR_ITEMS.slice(1)]
    : BASE_SIDEBAR_ITEMS;
}
