import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CandidateProjectsApp } from "./CandidatePortfolioApps";
import { getCandidateAchievements, getCandidateEducation, getCandidateProfile, getCandidateProjects } from "../api/candidate";

vi.mock("../api/candidate", () => ({
  getCandidateAchievements: vi.fn(),
  getCandidateEducation: vi.fn(),
  getCandidateProfile: vi.fn(),
  getCandidateProjects: vi.fn(),
}));

function renderApp() {
  return render(
    <MemoryRouter initialEntries={["/candidate/projects"]}>
      <CandidateProjectsApp />
    </MemoryRouter>
  );
}

describe("CandidateProjectsApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCandidateAchievements.mockResolvedValue([]);
    getCandidateEducation.mockResolvedValue([]);
    getCandidateProfile.mockResolvedValue(null);
    getCandidateProjects.mockResolvedValue([
      {
        id: 7,
        projectType: "Учебный",
        isOngoing: false,
        updatedAt: "2026-03-12T10:00:00Z",
        title: "Research sprint",
        shortDescription: "Кейс по исследованию пользовательских сценариев.",
        role: "UX researcher",
        tags: ["Research", "UX"],
      },
    ]);
  });

  it("links the project details button to the edit screen for the selected project", async () => {
    renderApp();

    expect(await screen.findByRole("link", { name: "Подробнее" })).toHaveAttribute(
      "href",
      "/candidate/projects/edit?projectId=7"
    );
  });
});
