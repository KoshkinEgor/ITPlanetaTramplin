import { describe, expect, it } from "vitest";
import { routes } from "../app/routes";
import { getConfirmView, loginRoleViews } from "./content";

describe("getConfirmView", () => {
  it("returns the candidate confirmation flow by default", () => {
    const view = getConfirmView("candidate", "register-candidate");

    expect(view.action).toBe(routes.candidate.career);
    expect(view.backHref).toBe(routes.auth.registerCandidate);
  });

  it("returns the employer verification flow for full company onboarding", () => {
    const view = getConfirmView("employer", "employer-verify");

    expect(view.action).toBe(routes.company.dashboard);
    expect(view.backHref).toBe(routes.auth.registerCompanyExtended);
  });

  it("maps curator login to the moderator dashboard", () => {
    expect(loginRoleViews.curator.action).toBe(routes.moderator.dashboard);
    expect(loginRoleViews.curator.registerHref).toBeNull();
  });
});
