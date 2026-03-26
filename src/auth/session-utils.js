import { buildAuthLoginRoute, routes } from "../app/routes";

export const AUTH_ROLES = Object.freeze({
  guest: "guest",
  candidate: "candidate",
  company: "company",
  moderator: "moderator",
});

export function normalizeAuthRole(role) {
  switch (role) {
    case "candidate":
    case "applicant":
      return AUTH_ROLES.candidate;
    case "company":
    case "employer":
      return AUTH_ROLES.company;
    case "moderator":
    case "curator":
      return AUTH_ROLES.moderator;
    default:
      return role;
  }
}

export function isKnownAuthRole(role) {
  const normalizedRole = normalizeAuthRole(role);

  return normalizedRole === AUTH_ROLES.candidate
    || normalizedRole === AUTH_ROLES.company
    || normalizedRole === AUTH_ROLES.moderator;
}

export function getCabinetRouteForRole(role) {
  switch (normalizeAuthRole(role)) {
    case AUTH_ROLES.candidate:
      return routes.candidate.profile;
    case AUTH_ROLES.company:
      return routes.company.dashboard;
    case AUTH_ROLES.moderator:
      return routes.moderator.dashboard;
    default:
      return routes.auth.login;
  }
}

export function getLoginRouteForRole(role) {
  switch (normalizeAuthRole(role)) {
    case AUTH_ROLES.company:
      return buildAuthLoginRoute({ role: "employer" });
    case AUTH_ROLES.moderator:
      return buildAuthLoginRoute({ role: "curator" });
    case AUTH_ROLES.candidate:
      return buildAuthLoginRoute({ role: "candidate" });
    default:
      return routes.auth.login;
  }
}

export function getRoleLabel(role) {
  switch (normalizeAuthRole(role)) {
    case AUTH_ROLES.candidate:
      return "Соискатель";
    case AUTH_ROLES.company:
      return "Компания";
    case AUTH_ROLES.moderator:
      return "Модератор";
    default:
      return "Пользователь";
  }
}

export function getUserDisplayName(user) {
  const displayName = typeof user?.displayName === "string" ? user.displayName.trim() : "";

  if (displayName) {
    return displayName;
  }

  const emailName = typeof user?.email === "string" ? user.email.trim().split("@")[0] : "";
  return emailName || "Профиль";
}
