import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CandidatePublicProfilePage } from "./CandidatePublicProfilePage";
import { createCandidateContact, getCandidateEducation, getCandidateProfile, getCandidateProjects } from "../../api/candidate";

vi.mock("../../api/candidate", () => ({
  getCandidateProfile: vi.fn(),
  getCandidateEducation: vi.fn(),
  getCandidateProjects: vi.fn(),
  createCandidateContact: vi.fn(),
}));

vi.mock("../../auth/api", () => ({
  useAuthSession: vi.fn(() => ({ status: "guest", user: null, error: null })),
}));

function renderPage(initialEntries = ["/candidate/public"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <CandidatePublicProfilePage />
    </MemoryRouter>
  );
}

describe("CandidatePublicProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("falls back to the demo public profile when candidate api is unavailable", async () => {
    getCandidateProfile.mockRejectedValue(new Error("Unauthorized"));
    getCandidateEducation.mockRejectedValue(new Error("Unauthorized"));
    getCandidateProjects.mockRejectedValue(new Error("Unauthorized"));

    renderPage();

    expect(await screen.findByRole("heading", { name: "Анна Ковалёва" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сообщение" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Добавить в друзья" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Исследование onboarding-сценария" })).toHaveLength(2);
  });

  it("renders live candidate data when the current profile is available", async () => {
    getCandidateProfile.mockResolvedValue({
      name: "Ирина",
      surname: "Соколова",
      description: "Проектирую интерфейсы и люблю исследовательскую работу.",
      skills: ["UX", "UI", "Research"],
      preferences: {
        visibility: {
          profileVisibility: "employers",
        },
      },
      links: {
        onboarding: {
          city: "Казань",
          goal: "Найти продуктовую стажировку",
          completedAt: "2026-03-01T10:00:00.000Z",
        },
        resumes: [
          {
            id: "resume-live",
            title: "UX/UI дизайнер",
            updatedAt: "2026-03-02T10:00:00.000Z",
            city: "Казань",
            visibility: "employers",
            stats: {
              impressions: 4,
              views: 2,
              invitations: 1,
            },
          },
        ],
      },
    });
    getCandidateEducation.mockResolvedValue([
      {
        id: "education-live",
        institutionName: "КФУ",
        graduationYear: 2026,
      },
    ]);
    getCandidateProjects.mockResolvedValue([
      {
        id: "project-live",
        projectType: "Проект",
        updatedAt: "2026-03-12T09:00:00.000Z",
        title: "Редизайн кабинета абитуриента",
        shortDescription: "Собрала пользовательские интервью и переработала ключевой сценарий подачи заявки.",
        role: "ux-исследователь",
        tags: ["Research", "UX"],
      },
    ]);

    renderPage();

    expect(await screen.findByRole("heading", { name: "Ирина Соколова" })).toBeInTheDocument();
    expect(screen.getByText(/Найти продуктовую стажировку/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Редизайн кабинета абитуриента" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "UX/UI дизайнер" })).toBeInTheDocument();
  });

  it("renders contact preview mode and allows adding the user to contacts", async () => {
    createCandidateContact.mockResolvedValue({});

    renderPage([
      "/candidate/public?userId=42&name=Мария%20Соколова&email=maria%40example.com&skills=SQL,UX",
    ]);

    expect(await screen.findByRole("heading", { name: "Мария Соколова" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Добавить в проект" })).toHaveAttribute("href", expect.stringContaining("/candidate/projects/edit"));
    expect(screen.getByRole("button", { name: "Добавить в контакты" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Добавить в контакты" }));

    await waitFor(() => {
      expect(createCandidateContact).toHaveBeenCalledWith({ userId: 42 });
    });

    expect(await screen.findByText(/Контакт добавлен/i)).toBeInTheDocument();
  });
});
