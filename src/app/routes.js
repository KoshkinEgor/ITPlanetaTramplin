export const routes = {
  home: "/",
  uiKit: "/ui-kit",
  homeDiscover: "/#discover",
  homeWorkflow: "/#workflow",
  homeCompanies: "/#companies",
  homeAbout: "/#about",
  auth: {
    login: "/auth/login",
    registerCandidate: "/auth/register/candidate",
    registerCompany: "/auth/register/company",
    registerCompanyExtended: "/auth/register/company/extended",
    confirmEmail: "/auth/confirm-email",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },
  opportunities: {
    catalog: "/opportunities",
    detail: "/opportunities/:id",
    detailCard: "/opportunities/design-ui-ux",
  },
  candidate: {
    root: "/candidate",
    profile: "/candidate/profile",
    resume: "/candidate/resume",
    resumeEdit: "/candidate/resume/edit",
    projects: "/candidate/projects",
    projectEdit: "/candidate/projects/edit",
    responses: "/candidate/responses",
    contacts: "/candidate/contacts",
    settings: "/candidate/settings",
  },
  company: {
    root: "/company/dashboard",
    dashboard: "/company/dashboard",
    opportunities: "/company/dashboard/opportunities",
    responses: "/company/dashboard/responses",
  },
  moderator: {
    root: "/moderator",
    dashboard: "/moderator/dashboard",
    opportunities: "/moderator/opportunities",
    companies: "/moderator/companies",
    users: "/moderator/users",
    complaints: "/moderator/complaints",
    tagsSystem: "/moderator/tags-system",
    logs: "/moderator/logs",
    settings: "/moderator/settings",
  },
  contacts: {
    profile: "/candidate/contacts",
  },
};

export function withSearch(path, params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export function buildAuthLoginRoute({ role, step } = {}) {
  return withSearch(routes.auth.login, { role, step });
}

export function buildConfirmEmailRoute({ role, flow, email }) {
  return withSearch(routes.auth.confirmEmail, { role, flow, email });
}

export function buildForgotPasswordRoute({ email } = {}) {
  return withSearch(routes.auth.forgotPassword, { email });
}

export function buildResetPasswordRoute({ email } = {}) {
  return withSearch(routes.auth.resetPassword, { email });
}

export function buildOpportunityDetailRoute(opportunityId = "design-ui-ux") {
  return routes.opportunities.detail.replace(":id", opportunityId);
}

export function buildCandidateSettingsRoute(section) {
  return withSearch(routes.candidate.settings, { section });
}

export function isInternalRouteHref(href) {
  return typeof href === "string" && href.startsWith("/") && !href.startsWith("//");
}
