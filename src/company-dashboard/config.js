import { PUBLIC_HEADER_NAV_ITEMS, routes } from "../app/routes";

export const COMPANY_HEADER_NAV = PUBLIC_HEADER_NAV_ITEMS;

export const COMPANY_SIDEBAR_ITEMS = [
  { key: "profile", label: "Страница компании", href: routes.company.dashboard },
  { key: "opportunities", label: "Возможности", href: routes.company.opportunities },
  { key: "responses", label: "Отклики", href: routes.company.responses },
];
