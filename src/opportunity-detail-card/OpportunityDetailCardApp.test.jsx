import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCandidateRecommendation, getCandidateApplications, getCandidateContacts } from "../api/candidate";
import { getCompanyProfile } from "../api/company";
import { applyToOpportunity, deleteOpportunity, getOpportunity, getOpportunities, updateOpportunity } from "../api/opportunities";
import { useAuthSession } from "../auth/api";
import { resetCandidateApplicationsStore, useCandidateApplications } from "../candidate-portal/candidate-applications-store";
import { FAVORITE_OPPORTUNITY_IDS_STORAGE_KEY } from "../features/favorites/storage";
import { ApiError } from "../lib/http";
import { OpportunityDetailCardApp } from "./OpportunityDetailCardApp";

vi.mock("../api/opportunities", () => ({
  getOpportunity: vi.fn(),
  getOpportunities: vi.fn(() => Promise.resolve([])),
  applyToOpportunity: vi.fn(),
  updateOpportunity: vi.fn(),
  deleteOpportunity: vi.fn(),
}));

vi.mock("../api/candidate", () => ({
  getCandidateApplications: vi.fn(() => Promise.resolve([])),
  getCandidateContacts: vi.fn(() => Promise.resolve([])),
  createCandidateRecommendation: vi.fn(() => Promise.resolve({})),
}));

vi.mock("../api/company", () => ({
  getCompanyProfile: vi.fn(),
}));

vi.mock("../auth/api", () => ({
  useAuthSession: vi.fn(),
}));

vi.mock("../widgets/layout/PortalHeader/PortalHeader", () => ({
  PortalHeader: ({ className }) => <header className={className}>PortalHeader</header>,
}));

const apiOpportunity = {
  id: 101,
  employerId: 404,
  title: "Junior Security Analyst",
  companyName: "ООО Компания",
  locationCity: "Москва",
  locationAddress: "Москва",
  opportunityType: "vacancy",
  employmentType: "online",
  moderationStatus: "approved",
  publishAt: "2026-03-10",
  description: "Сильная стартовая вакансия для кандидатов без большого коммерческого опыта.",
  contactsJson: '{"email":"career@example.com"}',
  mediaContentJson: '[{"title":"Программа вакансии"}]',
  tags: ["SOC", "SIEM"],
};

const appliedSummary = {
  id: 55,
  opportunityId: 101,
  status: "submitted",
  employerNote: null,
  appliedAt: "2026-03-12T12:00:00Z",
  opportunityTitle: "Junior Security Analyst",
  opportunityType: "vacancy",
  companyName: "ООО Компания",
  locationCity: "Москва",
  employmentType: "online",
  opportunityDeleted: false,
  moderationStatus: "approved",
};

const relatedOpportunity = {
  id: 202,
  employerId: 505,
  title: "Frontend Intern",
  companyName: "Sber",
  locationCity: "Москва",
  locationAddress: "Кутузовский проспект, 32",
  opportunityType: "vacancy",
  employmentType: "hybrid",
  moderationStatus: "approved",
  publishAt: "2026-03-11",
  description: "Стажировка по frontend-разработке.",
  contactsJson: '{"email":"internships@sber.local"}',
  mediaContentJson: "[]",
  tags: ["React", "TypeScript", "Frontend"],
};

function StoreConsumer() {
  const snapshot = useCandidateApplications({ autoRefresh: false });

  return (
    <div>
      <span data-testid="applications-count">{snapshot.applications.length}</span>
      <span data-testid="applications-title">{snapshot.applications[0]?.opportunityTitle ?? ""}</span>
    </div>
  );
}

function renderDetail(path = "/opportunities/design-ui-ux") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <StoreConsumer />
      <Routes>
        <Route path="/opportunities/:id" element={<OpportunityDetailCardApp />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("OpportunityDetailCardApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthSession.mockReturnValue({ status: "guest", user: null, error: null });
    getCompanyProfile.mockResolvedValue(null);
    resetCandidateApplicationsStore();
    window.localStorage.clear();
    window.open = vi.fn();
    getOpportunity.mockResolvedValue(apiOpportunity);
    getOpportunities.mockResolvedValue([]);
    applyToOpportunity.mockResolvedValue(appliedSummary);
    updateOpportunity.mockResolvedValue({});
    deleteOpportunity.mockResolvedValue({});
    getCandidateApplications.mockResolvedValue([]);
    createCandidateRecommendation.mockResolvedValue({});
    getCandidateContacts.mockResolvedValue([
      {
        userId: 901,
        name: "Anna Petrova",
        email: "anna.petrova@tramplin.local",
        skills: ["React"],
      },
    ]);
  });

  it("renders the enriched demo detail page and cleans up the body class", async () => {
    const { unmount } = renderDetail();

    expect(document.body).toHaveClass("opportunity-card-react-body");
    expect(await screen.findByRole("heading", { name: /UI\/UX/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ключевые навыки" })).toBeInTheDocument();
    expect(screen.getByText("Медиа")).toBeInTheDocument();
    expect(screen.getByText("Вам могут подойти")).toBeInTheDocument();

    unmount();

    expect(document.body).not.toHaveClass("opportunity-card-react-body");
  });

  it("pushes a successful application into the shared candidate responses store", async () => {
    renderDetail("/opportunities/101");

    const [applyButton] = await screen.findAllByRole("button", { name: /Отклик/ });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getAllByText("Отклик отправлен").length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(screen.getByTestId("applications-count").textContent).toBe("1");
      expect(screen.getByTestId("applications-title").textContent).toBe("Junior Security Analyst");
    });
  });

  it("links the company spotlight to the public company page", async () => {
    renderDetail("/opportunities/101");

    expect(await screen.findByRole("link", { name: "Открыть профиль компании" })).toHaveAttribute("href", "/companies/404");
  });

  it("opens complaint and share options from the more actions button", async () => {
    renderDetail("/opportunities/101");

    await screen.findByText("Junior Security Analyst");
    const menuButton = document.querySelector(".opportunity-focus-card__menu button");

    expect(menuButton).not.toBeNull();
    fireEvent.click(menuButton);

    expect(screen.getAllByRole("menuitem")).toHaveLength(2);
  });

  it("opens the share modal with contacts and triggers sharing for the selected contact", async () => {
    renderDetail("/opportunities/101");

    await screen.findByText("Junior Security Analyst");
    const menuButton = document.querySelector(".opportunity-focus-card__menu button");

    expect(menuButton).not.toBeNull();
    fireEvent.click(menuButton);
    fireEvent.click(screen.getAllByRole("menuitem")[1]);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(await screen.findByText("Anna Petrova")).toBeInTheDocument();

    const shareButton = document.querySelector(".opportunity-share-modal__item .ui-button");

    expect(shareButton).not.toBeNull();
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(createCandidateRecommendation).toHaveBeenCalledWith({
        candidateId: 901,
        opportunityId: 101,
        message: expect.stringContaining("Junior Security Analyst"),
      });
      expect(window.open).toHaveBeenCalledTimes(1);
      expect(window.open.mock.calls[0][0]).toContain("mailto:anna.petrova@tramplin.local");
    });
  });

  it("adds the opportunity to favorites in localStorage from the heart button", async () => {
    renderDetail("/opportunities/101");

    await screen.findByText("Junior Security Analyst");
    const favoriteButton = document.querySelector('.opportunity-focus-card__toolbar button[data-opportunity-id="101"]');

    expect(favoriteButton).not.toBeNull();
    fireEvent.click(favoriteButton);

    expect(JSON.parse(window.localStorage.getItem(FAVORITE_OPPORTUNITY_IDS_STORAGE_KEY) ?? "[]")).toEqual(["101"]);
    expect(favoriteButton).toHaveAttribute("aria-pressed", "true");
  });

  it("adds a related recommendation card to favorites with the same active styling", async () => {
    getOpportunities.mockResolvedValue([apiOpportunity, relatedOpportunity]);

    renderDetail("/opportunities/101");

    expect(await screen.findByText("Frontend Intern")).toBeInTheDocument();

    const favoriteButtons = Array.from(document.querySelectorAll("button[data-opportunity-id]"));
    const relatedFavoriteButton = favoriteButtons[favoriteButtons.length - 1];

    fireEvent.click(relatedFavoriteButton);

    expect(JSON.parse(window.localStorage.getItem(FAVORITE_OPPORTUNITY_IDS_STORAGE_KEY) ?? "[]")).toEqual(["202"]);
    expect(relatedFavoriteButton).toHaveAttribute("aria-pressed", "true");
    expect(relatedFavoriteButton.className).toContain("ui-opportunity-mini-card__favorite");
  });

  it("treats a 409 application response as a synced success state instead of an error", async () => {
    applyToOpportunity.mockRejectedValue(
      new ApiError("Отклик уже отправлен.", { status: 409, data: { message: "Отклик уже отправлен." } })
    );
    getCandidateApplications.mockResolvedValue([appliedSummary]);

    renderDetail("/opportunities/101");

    const [applyButton] = await screen.findAllByRole("button", { name: /Отклик/ });
    fireEvent.click(applyButton);

    expect(await screen.findByText("Отклик уже отправлен")).toBeInTheDocument();
    expect(screen.queryByText("Не удалось отправить заявку")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(getCandidateApplications).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("applications-count").textContent).toBe("1");
    });
  });

  it("shows owner-only controls and moderation reason for company users", async () => {
    useAuthSession.mockReturnValue({ status: "authenticated", user: { role: "company" }, error: null });
    getCompanyProfile.mockResolvedValue({ profileId: 404 });
    getOpportunity.mockResolvedValue({
      ...apiOpportunity,
      moderationStatus: "revision",
      moderationReason: "Добавьте зарплату",
    });

    renderDetail("/opportunities/101");

    expect(await screen.findByRole("button", { name: "Редактировать" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Просмотр публичной версии" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Открыть отклики" })).toHaveAttribute("href", "/company/dashboard/responses");
    expect(screen.getByText("Добавьте зарплату")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Отклик отправлен|Подать заявку/ })).not.toBeInTheDocument();
  });
});
