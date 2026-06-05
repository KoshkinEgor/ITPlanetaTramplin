import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CandidateCareerPage } from "./CandidateCareerPage";

const apiMocks = vi.hoisted(() => ({
  getCandidateAiCareerRecommendations: vi.fn(),
  getCandidateAiCareerJob: vi.fn(),
  queueCandidateAiCareerRecommendations: vi.fn(),
}));
const applicationState = vi.hoisted(() => ({
  status: "ready",
  applications: [],
}));

vi.mock("../../api/candidate", () => ({
  createCandidateEducation: vi.fn(),
  deleteCandidateEducation: vi.fn(),
  getCandidateApplications: vi.fn().mockResolvedValue([]),
  getCandidateAiCareerRecommendations: apiMocks.getCandidateAiCareerRecommendations,
  getCandidateAiCareerJob: apiMocks.getCandidateAiCareerJob,
  getCandidateContactSuggestions: vi.fn().mockResolvedValue([]),
  getCandidateContacts: vi.fn().mockResolvedValue([]),
  getCandidateEducation: vi.fn().mockResolvedValue([]),
  getCandidateDirectory: vi.fn().mockResolvedValue([]),
  getCandidateProfile: vi.fn().mockResolvedValue({}),
  getCandidateRecommendations: vi.fn().mockResolvedValue([]),
  getCandidateProjects: vi.fn().mockResolvedValue([]),
  queueCandidateAiCareerRecommendations: apiMocks.queueCandidateAiCareerRecommendations,
  updateCandidateEducation: vi.fn(),
  updateCandidateProfile: vi.fn(),
}));

vi.mock("../../api/opportunities", () => ({
  getOpportunities: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../api/cities", () => ({
  searchYandexCityOptions: vi.fn().mockResolvedValue([]),
}));

vi.mock("./candidate-access", () => ({
  loadCandidateCareerContext: vi.fn().mockResolvedValue({
    kind: "candidate",
    onboardingComplete: true,
    skippedAt: null,
    profile: {
      id: 10,
      name: "Анна",
      surname: "Иванова",
      description: "Frontend developer",
      skills: ["React"],
    },
    education: [],
  }),
}));

vi.mock("../../candidate-portal/candidate-applications-store", () => ({
  useCandidateApplications: () => applicationState,
}));

vi.mock("./CandidateCareerDashboard", () => ({
  CandidateCareerDashboard: ({ dashboardState }) => (
    <div>
      <span>{dashboardState.aiRecommendations?.summary}</span>
      <span>{dashboardState.aiStatus}</span>
    </div>
  ),
}));

describe("CandidateCareerPage AI polling", () => {
  beforeEach(() => {
    vi.useRealTimers();
    localStorage.setItem("career-dashboard-mode", "ai");
    apiMocks.getCandidateAiCareerRecommendations.mockReset();
    apiMocks.getCandidateAiCareerJob.mockReset();
    apiMocks.queueCandidateAiCareerRecommendations.mockReset();
  });

  it("restores an active job, keeps old data, then loads the completed overview", async () => {
    apiMocks.getCandidateAiCareerRecommendations
      .mockResolvedValueOnce({
        summary: "Старый обзор",
        refreshReason: "cache_hit",
        generation: {
          jobId: "11111111-1111-1111-1111-111111111111",
          status: "running",
          steps: [
            { step: "profile", status: "succeeded" },
            { step: "career", status: "running" },
            { step: "opportunities", status: "queued" },
          ],
        },
      })
      .mockResolvedValueOnce({
        summary: "Новый обзор",
        refreshReason: "manual",
        status: "fresh",
      });
    apiMocks.getCandidateAiCareerJob
      .mockResolvedValueOnce({
        jobId: "11111111-1111-1111-1111-111111111111",
        status: "running",
        steps: [],
      })
      .mockResolvedValueOnce({
        jobId: "11111111-1111-1111-1111-111111111111",
        status: "succeeded",
        steps: [],
      });

    render(
      <MemoryRouter>
        <CandidateCareerPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Старый обзор")).toBeInTheDocument());
    expect(screen.getByText("loading")).toBeInTheDocument();

    await waitFor(
      () => expect(screen.getByText("Новый обзор")).toBeInTheDocument(),
      { timeout: 4_000 }
    );
    expect(screen.getByText("ready")).toBeInTheDocument();
    expect(apiMocks.getCandidateAiCareerJob).toHaveBeenCalledTimes(2);
  });
});
