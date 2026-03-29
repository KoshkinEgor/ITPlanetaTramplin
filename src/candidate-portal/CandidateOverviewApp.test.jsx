import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCandidateContactSuggestions, getCandidateContacts } from "../api/candidate";
import { getOpportunities } from "../api/opportunities";
import { CandidateOverviewApp } from "./CandidateOverviewApp";

const useCandidateApplicationsMock = vi.fn();

vi.mock("../api/candidate", () => ({
  getCandidateContacts: vi.fn(() => Promise.resolve([])),
  getCandidateContactSuggestions: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../api/opportunities", () => ({
  getOpportunities: vi.fn(() => Promise.resolve([])),
}));

vi.mock("./candidate-applications-store", () => ({
  useCandidateApplications: (...args) => useCandidateApplicationsMock(...args),
}));

function renderApp(profile) {
  return render(
    <MemoryRouter>
      <CandidateOverviewApp profile={profile} />
    </MemoryRouter>
  );
}

describe("CandidateOverviewApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCandidateApplicationsMock.mockReturnValue({
      status: "ready",
      applications: [],
      error: null,
    });
    getCandidateContacts.mockResolvedValue([]);
    getCandidateContactSuggestions.mockResolvedValue([]);
    getOpportunities.mockResolvedValue([]);
  });

  it("renders network, suggestions, and recent actions", async () => {
    getCandidateContacts.mockResolvedValue([
      {
        contactProfileId: 12,
        name: "Мария Соколова",
        email: "maria@example.com",
        skills: ["SQL", "UX", "Research"],
        createdAt: "2026-03-14T10:00:00Z",
      },
    ]);
    getCandidateContactSuggestions.mockResolvedValue([
      {
        userId: 28,
        name: "Илья Демин",
        email: "ilya@example.com",
        city: "Москва",
        skills: ["Analytics", "UX"],
        reasons: ["Общие навыки: Analytics, UX"],
        relationship: {
          contactState: "none",
          friendState: "none",
          projectInviteState: "none",
        },
      },
    ]);
    getOpportunities.mockResolvedValue([
      {
        id: 101,
        opportunityType: "vacancy",
        moderationStatus: "approved",
        title: "Junior Product Analyst",
        companyName: "Signal Hub",
        locationCity: "Москва",
        employmentType: "remote",
        salaryFrom: 100000,
        salaryTo: 130000,
        tags: ["Product", "Research"],
      },
    ]);
    useCandidateApplicationsMock.mockReturnValue({
      status: "ready",
      applications: [
        {
          id: 44,
          status: "submitted",
          appliedAt: "2026-03-15T12:00:00Z",
          opportunityTitle: "Летняя школа SOC",
          companyName: "SOC Lab",
          locationCity: "Москва",
        },
      ],
      error: null,
    });

    renderApp({ skills: ["SQL", "UX", "Research"] });

    expect(await screen.findByText("Мария Соколова")).toBeInTheDocument();
    expect(screen.getByText("3 общих навыка: SQL, UX, Research")).toBeInTheDocument();
    expect(screen.getByText("Люди для вас")).toBeInTheDocument();
    expect(screen.getByText("Илья Демин")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Открыть contacts hub" })).toHaveAttribute("href", "/candidate/contacts");
    expect(screen.getByText("Последние действия")).toBeInTheDocument();
    expect(screen.getByText("Отклик отправлен: Летняя школа SOC")).toBeInTheDocument();
    expect(screen.getByText("Добавлен контакт Мария Соколова")).toBeInTheDocument();
  });

  it("keeps catalog action in the header and detail action inside cards", async () => {
    getOpportunities.mockResolvedValue([
      {
        id: 101,
        opportunityType: "vacancy",
        moderationStatus: "approved",
        title: "Junior Product Analyst",
        companyName: "Signal Hub",
        locationCity: "Moscow",
        employmentType: "remote",
        salaryFrom: 100000,
        salaryTo: 130000,
        tags: ["Product", "Research"],
      },
    ]);

    renderApp({ skills: ["SQL", "UX", "Research"] });

    expect(await screen.findByRole("link", { name: "Перейти в каталог" })).toHaveAttribute("href", "/opportunities");
    expect(screen.getByRole("link", { name: "Подробнее" })).toHaveAttribute("href", "/opportunities/101");
    expect(screen.queryByRole("link", { name: "Открыть каталог" })).not.toBeInTheDocument();
    expect(screen.getByText("Зарплата")).toBeInTheDocument();
    expect(screen.getByText(/100/)).toBeInTheDocument();
    expect(screen.getByText("Формат: Удаленно")).toBeInTheDocument();
  });
});
