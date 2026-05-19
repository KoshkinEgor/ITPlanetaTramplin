import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CandidateProjectEditorApp } from "./CandidateProjectEditorApp";
import { createCandidateProject, deleteCandidateProject, getCandidateProjects, updateCandidateProject } from "../api/candidate";

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../api/candidate", () => ({
  createCandidateProject: vi.fn(),
  deleteCandidateProject: vi.fn(),
  getCandidateProjects: vi.fn(),
  updateCandidateProject: vi.fn(),
}));

function renderApp(initialEntry = "/candidate/projects/edit?projectId=7") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <CandidateProjectEditorApp />
    </MemoryRouter>
  );
}

describe("CandidateProjectEditorApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    createCandidateProject.mockResolvedValue({});
    deleteCandidateProject.mockResolvedValue({});
    updateCandidateProject.mockResolvedValue({});
    getCandidateProjects.mockResolvedValue([
      {
        id: 7,
        title: "Research sprint",
        projectType: "Учебный",
        shortDescription: "Кейс по исследованию пользовательских сценариев.",
        organization: "IT Planet",
        role: "UX researcher",
        teamSize: 3,
        startDate: "2026-01-01",
        endDate: "2026-02-01",
        isOngoing: false,
        problem: "Нужно было проверить спрос на новый сервис.",
        contribution: "Провела интервью и собрала инсайты.",
        result: "Команда запустила MVP на основе исследования.",
        metrics: "12 интервью, 3 CJM",
        lessonsLearned: "Ранние интервью помогают быстрее сузить решение.",
        tags: ["Research", "Figma"],
        coverImageUrl: "https://example.com/cover.png",
        participants: [{ name: "Анна", role: "Дизайнер" }],
        demoUrl: "https://example.com/demo",
        repositoryUrl: "https://github.com/acme/research-sprint",
        designUrl: "https://figma.com/file/abc",
        caseStudyUrl: "https://example.com/case",
        showInPortfolio: true,
      },
    ]);
  });

  it("loads an existing project by projectId and saves it through updateCandidateProject", async () => {
    renderApp();

    expect(await screen.findByDisplayValue("Research sprint")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-01")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сохранить изменения" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Сохранить изменения" }));

    await waitFor(() => {
      expect(updateCandidateProject).toHaveBeenCalledWith("7", {
        title: "Research sprint",
        projectType: "Учебный",
        shortDescription: "Кейс по исследованию пользовательских сценариев.",
        organization: "IT Planet",
        role: "UX researcher",
        teamSize: 3,
        startDate: "2026-01",
        endDate: "2026-02",
        isOngoing: false,
        problem: "Нужно было проверить спрос на новый сервис.",
        contribution: "Провела интервью и собрала инсайты.",
        result: "Команда запустила MVP на основе исследования.",
        metrics: "12 интервью, 3 CJM",
        lessonsLearned: "Ранние интервью помогают быстрее сузить решение.",
        tags: ["Research", "Figma"],
        coverImageUrl: "https://example.com/cover.png",
        participants: [{ name: "Анна", role: "Дизайнер" }],
        demoUrl: "https://example.com/demo",
        repositoryUrl: "https://github.com/acme/research-sprint",
        designUrl: "https://figma.com/file/abc",
        caseStudyUrl: "https://example.com/case",
        showInPortfolio: true,
      });
    });

    expect(createCandidateProject).not.toHaveBeenCalled();
  });

  it("deletes the current project from edit page", async () => {
    renderApp();

    fireEvent.click(await screen.findByRole("button", { name: "Удалить проект" }));

    await waitFor(() => {
      expect(deleteCandidateProject).toHaveBeenCalledWith("7");
      expect(navigateMock).toHaveBeenCalledWith("/candidate/projects");
    });
  });
});
