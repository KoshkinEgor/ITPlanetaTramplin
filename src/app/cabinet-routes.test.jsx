import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentAuthUser, logoutCurrentAuthUser, useAuthSession } from "../auth/api";
import { updateCandidateProfile } from "../api/candidate";
import { getCompanyOpportunities, getCompanyProfile } from "../api/company";
import { resetCandidateApplicationsStore } from "../candidate-portal/candidate-applications-store";
import { getModerationCompanies, getModerationOpportunities, getModerationUsers } from "../api/moderation";
import { AppRoutes } from "./AppRouter";
import { routes } from "./routes";

const candidateProfile = {
  id: 1,
  name: "Anna",
  surname: "Kovaleva",
  email: "anna@example.com",
  description: "Candidate profile description",
  skills: ["SQL", "UX", "Figma"],
  links: {
    onboarding: {
      profession: "Designer",
      gender: "female",
      birthDate: "2004-02-21",
      phone: "+7 927 563 89 41",
      city: "Cheboksary",
      citizenship: "Russia",
      experience: {
        noExperience: true,
      },
      goal: "Get an internship in UX/UI design",
    },
  },
};

const companyProfile = {
  id: 1,
  companyName: "Tramplin Labs",
  description: "Company profile description",
  verificationStatus: "approved",
};

vi.mock("../api/candidate", () => ({
  getCandidateProfile: vi.fn(() => Promise.resolve(candidateProfile)),
  updateCandidateProfile: vi.fn(() => Promise.resolve(candidateProfile)),
  getCandidateEducation: vi.fn(() =>
    Promise.resolve([
      {
        id: 1,
        institutionName: "State University",
        faculty: "Design",
        specialization: "Interface design",
        graduationYear: 2027,
      },
    ])
  ),
  createCandidateEducation: vi.fn(() => Promise.resolve({ id: 1 })),
  updateCandidateEducation: vi.fn(() => Promise.resolve({ id: 1 })),
  deleteCandidateEducation: vi.fn(() => Promise.resolve({})),
  getCandidateAchievements: vi.fn(() => Promise.resolve([])),
  createCandidateAchievement: vi.fn(() => Promise.resolve({ id: 1 })),
  updateCandidateAchievement: vi.fn(() => Promise.resolve({ id: 1 })),
  deleteCandidateAchievement: vi.fn(() => Promise.resolve({})),
  getCandidateProjects: vi.fn(() => Promise.resolve([])),
  createCandidateProject: vi.fn(() => Promise.resolve({ id: 1 })),
  updateCandidateProject: vi.fn(() => Promise.resolve({ id: 1 })),
  deleteCandidateProject: vi.fn(() => Promise.resolve({})),
  getCandidateApplications: vi.fn(() => Promise.resolve([])),
  withdrawCandidateApplication: vi.fn(() => Promise.resolve({})),
  confirmCandidateApplication: vi.fn(() => Promise.resolve({})),
  getCandidateContacts: vi.fn(() => Promise.resolve([])),
  createCandidateContact: vi.fn(() => Promise.resolve({ id: 1 })),
  deleteCandidateContact: vi.fn(() => Promise.resolve({})),
  getCandidateRecommendations: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../auth/api", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    getCurrentAuthUser: vi.fn(() =>
      Promise.resolve({
        id: 1,
        role: "candidate",
        email: "anna@example.com",
      })
    ),
    useAuthSession: vi.fn(() => ({
      status: "authenticated",
      user: {
        id: 1,
        role: "candidate",
        email: "anna@example.com",
      },
      error: null,
    })),
    logoutCurrentAuthUser: vi.fn(() => Promise.resolve({})),
  };
});

vi.mock("../api/company", () => ({
  getCompanyProfile: vi.fn(() => Promise.resolve(companyProfile)),
  updateCompanyProfile: vi.fn(() => Promise.resolve(companyProfile)),
  getCompanyOpportunities: vi.fn(() => Promise.resolve([])),
  getOpportunityApplications: vi.fn(() => Promise.resolve([])),
  updateOpportunityApplicationStatus: vi.fn(() => Promise.resolve({ id: 1 })),
}));

vi.mock("../api/opportunities", () => ({
  getOpportunities: vi.fn(() => Promise.resolve([])),
  getOpportunity: vi.fn(() => Promise.resolve(null)),
  createOpportunity: vi.fn(() => Promise.resolve({ id: 1 })),
  updateOpportunity: vi.fn(() => Promise.resolve({ id: 1 })),
  deleteOpportunity: vi.fn(() => Promise.resolve({})),
  applyToOpportunity: vi.fn(() => Promise.resolve({})),
}));

vi.mock("../api/moderation", () => ({
  getModerationCompanies: vi.fn(() => Promise.resolve([])),
  getModerationOpportunities: vi.fn(() => Promise.resolve([])),
  getModerationUsers: vi.fn(() => Promise.resolve([])),
  decideCompanyModeration: vi.fn(() => Promise.resolve({})),
  decideOpportunityModeration: vi.fn(() => Promise.resolve({})),
}));

vi.mock("../widgets/layout/PortalHeader/PortalHeader", () => ({
  PortalHeader: ({ className, actionHref, actionLabel }) => (
    <header className={className}>
      <span>PortalHeader</span>
      {actionHref && actionLabel ? <a href={actionHref}>{actionLabel}</a> : null}
    </header>
  ),
}));

function renderRoute(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes uiKitEnabled />
    </MemoryRouter>
  );
}

function getCandidateProgressValues(container) {
  return Array.from(container.querySelectorAll(".candidate-progress-card__value > span:first-child"))
    .map((node) => node.textContent);
}

function setSession(user, status = "authenticated") {
  getCurrentAuthUser.mockResolvedValue(user);
  useAuthSession.mockReturnValue({
    status,
    user,
    error: null,
  });
}

describe("cabinet shell routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCandidateApplicationsStore();
    setSession({
      id: 1,
      role: "candidate",
      email: "anna@example.com",
    });
    logoutCurrentAuthUser.mockResolvedValue({});
  });

  it("renders candidate section routes inside the cabinet shell", async () => {
    renderRoute(routes.candidate.profile);

    expect(await screen.findByTestId("candidate-cabinet-shell")).toBeInTheDocument();
    expect(screen.queryByTestId("candidate-standalone-shell")).not.toBeInTheDocument();
  });

  it("keeps candidate editor routes standalone", async () => {
    renderRoute(routes.candidate.resumeEdit);

    expect(await screen.findByTestId("candidate-standalone-shell")).toBeInTheDocument();
    expect(screen.queryByTestId("candidate-cabinet-shell")).not.toBeInTheDocument();
  });

  it("updates candidate progress after saving profile settings inside the cabinet shell", async () => {
    updateCandidateProfile.mockResolvedValue({
      ...candidateProfile,
      description: "",
    });

    const { container } = renderRoute(routes.candidate.settings);

    expect(await screen.findByTestId("candidate-cabinet-shell")).toBeInTheDocument();

    await waitFor(() => {
      expect(getCandidateProgressValues(container)).toEqual(["75", "75"]);
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Редактировать" })[0]);
    fireEvent.change(screen.getByLabelText("О себе"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => {
      expect(updateCandidateProfile).toHaveBeenCalledTimes(1);
      expect(getCandidateProgressValues(container)).toEqual(["55", "55"]);
    });
  });

  it("redirects guests from candidate routes to the career entry page", async () => {
    getCurrentAuthUser.mockRejectedValue({ status: 401 });
    useAuthSession.mockReturnValue({
      status: "guest",
      user: null,
      error: null,
    });

    renderRoute(routes.candidate.profile);

    await waitFor(() => {
      expect(document.querySelector(".candidate-career-page")).toBeInTheDocument();
      expect(screen.queryByTestId("candidate-cabinet-shell")).not.toBeInTheDocument();
    });
  });

  it("renders company section routes inside the company shell for company users", async () => {
    setSession({
      id: 2,
      role: "company",
      email: "company@example.com",
    });

    renderRoute(routes.company.opportunities);

    expect(await screen.findByTestId("company-cabinet-shell")).toBeInTheDocument();
  });

  it("shows the company summary on the company page", async () => {
    setSession({
      id: 2,
      role: "company",
      email: "company@example.com",
    });

    const { container } = renderRoute(routes.company.dashboard);

    expect(await screen.findByTestId("company-cabinet-shell")).toBeInTheDocument();

    await waitFor(() => {
      expect(container.querySelector(".company-profile-summary")).toBeInTheDocument();
    });
  });

  it("slides the company portfolio carousel inside the company page", async () => {
    setSession({
      id: 2,
      role: "company",
      email: "company@example.com",
    });

    renderRoute(routes.company.dashboard);

    const slider = await screen.findByTestId("company-profile-portfolio-slider");
    const sliderScope = within(slider);
    const track = screen.getByTestId("company-profile-portfolio-track");

    expect(track).toHaveStyle("transform: translateX(-0%)");

    fireEvent.click(sliderScope.getByRole("button", { name: "Дальше" }));

    expect(track).toHaveStyle("transform: translateX(-100%)");

    fireEvent.click(sliderScope.getByRole("button", { name: "Назад" }));

    expect(track).toHaveStyle("transform: translateX(-0%)");
  });

  it("skips the company summary outside the company page", async () => {
    setSession({
      id: 2,
      role: "company",
      email: "company@example.com",
    });

    const { container } = renderRoute(routes.company.opportunities);

    expect(await screen.findByTestId("company-cabinet-shell")).toBeInTheDocument();

    await waitFor(() => {
      expect(getCompanyOpportunities).toHaveBeenCalled();
    });

    expect(container.querySelector(".company-profile-summary")).not.toBeInTheDocument();
    expect(getCompanyProfile).not.toHaveBeenCalled();
  });

  it("redirects guests from company routes to the login page", async () => {
    getCurrentAuthUser.mockRejectedValue({ status: 401 });
    useAuthSession.mockReturnValue({
      status: "guest",
      user: null,
      error: null,
    });

    renderRoute(routes.company.dashboard);

    await waitFor(() => {
      expect(document.querySelector(".auth-login-card")).toBeInTheDocument();
    });
  });

  it("redirects non-company users from company routes to their own cabinet", async () => {
    setSession({
      id: 1,
      role: "candidate",
      email: "anna@example.com",
    });

    renderRoute(routes.company.dashboard);

    expect(await screen.findByTestId("candidate-cabinet-shell")).toBeInTheDocument();
    expect(screen.queryByTestId("company-cabinet-shell")).not.toBeInTheDocument();
  });

  it("renders moderator logs inside the moderator shell", async () => {
    setSession({
      id: 7,
      role: "moderator",
      email: "moderator@example.com",
    });

    renderRoute(routes.moderator.logs);

    expect(await screen.findByTestId("moderator-cabinet-shell")).toBeInTheDocument();
    expect(await screen.findByTestId("moderator-activity-log")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: /Signal Hub/i })).toBeInTheDocument();
  });

  it("hides moderator invitations in the sidebar for non-admin moderators", async () => {
    setSession({
      id: 7,
      role: "moderator",
      email: "moderator@example.com",
      isAdministrator: false,
    });

    renderRoute(routes.moderator.logs);

    expect(await screen.findByTestId("moderator-cabinet-shell")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Приглашения модераторов/i })).not.toBeInTheDocument();
  });

  it("shows moderator invitations in the sidebar for administrator", async () => {
    setSession({
      id: 1,
      role: "moderator",
      email: "administrator@tramplin.local",
      isAdministrator: true,
    });

    renderRoute(routes.moderator.logs);

    expect(await screen.findByTestId("moderator-cabinet-shell")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Приглашения модераторов/i })).toBeInTheDocument();
  });

  it("loads moderator dashboard data only on the dashboard route", async () => {
    setSession({
      id: 7,
      role: "moderator",
      email: "moderator@example.com",
    });

    const { container } = renderRoute(routes.moderator.dashboard);

    await waitFor(() => {
      expect(getModerationCompanies).toHaveBeenCalledTimes(1);
      expect(getModerationOpportunities).toHaveBeenCalledTimes(1);
      expect(getModerationUsers).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByTestId("moderator-cabinet-shell")).toBeInTheDocument();
    expect(container.querySelector(".moderator-dashboard-stack")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /дашборд модерации/i })).toBeInTheDocument();
  }, 15000);

  it("skips the moderator dashboard data fetch outside the dashboard route", async () => {
    setSession({
      id: 7,
      role: "moderator",
      email: "moderator@example.com",
    });

    const { container } = renderRoute(routes.moderator.logs);

    expect(await screen.findByTestId("moderator-activity-log")).toBeInTheDocument();
    expect(container.querySelector(".moderator-dashboard-stack")).not.toBeInTheDocument();
    expect(getModerationCompanies).not.toHaveBeenCalled();
    expect(getModerationOpportunities).not.toHaveBeenCalled();
    expect(getModerationUsers).not.toHaveBeenCalled();
  });

  it("redirects guests from moderator routes to the login page", async () => {
    getCurrentAuthUser.mockRejectedValue({ status: 401 });
    useAuthSession.mockReturnValue({
      status: "guest",
      user: null,
      error: null,
    });

    renderRoute(routes.moderator.dashboard);

    await waitFor(() => {
      expect(document.querySelector(".auth-login-card")).toBeInTheDocument();
    });
  });

  it("redirects non-moderators from moderator routes to their own cabinet", async () => {
    setSession({
      id: 9,
      role: "company",
      email: "company@example.com",
    });

    renderRoute(routes.moderator.dashboard);

    expect(await screen.findByTestId("company-cabinet-shell")).toBeInTheDocument();
    expect(screen.queryByTestId("moderator-cabinet-shell")).not.toBeInTheDocument();
  });

  it("redirects authenticated users away from the login page", async () => {
    setSession({
      id: 7,
      role: "moderator",
      email: "moderator@example.com",
    });

    renderRoute(routes.auth.login);

    expect(await screen.findByTestId("moderator-cabinet-shell")).toBeInTheDocument();
    expect(screen.queryByTestId("auth-page")).not.toBeInTheDocument();
  });
});
