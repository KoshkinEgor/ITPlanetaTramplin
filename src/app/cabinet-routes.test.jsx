import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentAuthUser } from "../auth/api";
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
      profession: "Дизайнер интерфейсов",
      gender: "female",
      birthDate: "2004-02-21",
      phone: "+7 927 563 89 41",
      city: "Чебоксары",
      citizenship: "Россия",
      experience: {
        noExperience: true,
      },
      goal: "Пройти стажировку на позицию UX/UI дизайнера",
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
  getCandidateEducation: vi.fn(() => Promise.resolve([
    {
      id: 1,
      institutionName: "ЧГУ им. И. Н. Ульянова",
      faculty: "Информатика",
      specialization: "Дизайн интерфейсов",
      graduationYear: 2027,
    },
  ])),
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
  getCandidateContacts: vi.fn(() => Promise.resolve([])),
  createCandidateContact: vi.fn(() => Promise.resolve({ id: 1 })),
  deleteCandidateContact: vi.fn(() => Promise.resolve({})),
  getCandidateRecommendations: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../auth/api", () => ({
  getCurrentAuthUser: vi.fn(() => Promise.resolve({
    id: 1,
    role: "candidate",
    email: "anna@example.com",
  })),
}));

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
  getModerationDashboard: vi.fn(() => Promise.resolve({
    opportunitiesPending: 4,
    companiesPending: 2,
    totalUsers: 16,
  })),
  getModerationCompanies: vi.fn(() => Promise.resolve([])),
  getModerationOpportunities: vi.fn(() => Promise.resolve([])),
  getModerationUsers: vi.fn(() => Promise.resolve([])),
  decideCompanyModeration: vi.fn(() => Promise.resolve({})),
  decideOpportunityModeration: vi.fn(() => Promise.resolve({})),
}));

function renderRoute(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes uiKitEnabled />
    </MemoryRouter>
  );
}

describe("cabinet shell routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentAuthUser.mockResolvedValue({
      id: 1,
      role: "candidate",
      email: "anna@example.com",
    });
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

  it("redirects guests from candidate routes to the career entry page", async () => {
    getCurrentAuthUser.mockRejectedValue({ status: 401 });

    renderRoute(routes.candidate.profile);

    expect(await screen.findByRole("heading", { name: "Хочешь построить карьеру?" })).toBeInTheDocument();
  });

  it("renders company section routes inside the company shell", async () => {
    renderRoute(routes.company.opportunities);

    expect(await screen.findByTestId("company-cabinet-shell")).toBeInTheDocument();
  });

  it("renders moderator placeholder routes inside the moderator shell", async () => {
    renderRoute(routes.moderator.logs);

    expect(await screen.findByTestId("moderator-cabinet-shell")).toBeInTheDocument();
    expect(await screen.findByText(/content placeholder/i)).toBeInTheDocument();
  });
});
