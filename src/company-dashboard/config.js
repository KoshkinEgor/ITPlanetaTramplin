import { routes } from "../app/routes";

export const COMPANY_HEADER_NAV = [
  { key: "opportunities", label: "Возможности", href: routes.opportunities.catalog },
  { key: "candidates", label: "Соискатели", href: routes.candidate.profile },
  { key: "about", label: "О платформе", href: routes.homeAbout },
];

export const COMPANY_SIDEBAR_ITEMS = [
  { key: "profile", label: "Страница компании", href: routes.company.dashboard },
  { key: "opportunities", label: "Возможности", href: routes.company.opportunities },
  { key: "responses", label: "Отклики", href: routes.company.responses },
];
