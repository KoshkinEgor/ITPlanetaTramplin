import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCandidateApplications } from "../api/candidate";
import { getCompanyProfile } from "../api/company";
import { applyToOpportunity, getOpportunity, getOpportunities } from "../api/opportunities";
import { resetCandidateApplicationsStore, useCandidateApplications } from "../candidate-portal/candidate-applications-store";
import { useAuthSession } from "../auth/api";
import { ApiError } from "../lib/http";
import { OpportunityDetailCardApp } from "./OpportunityDetailCardApp";

vi.mock("../api/opportunities", () => ({
  getOpportunity: vi.fn(),
  getOpportunities: vi.fn(() => Promise.resolve([])),
  applyToOpportunity: vi.fn(),
}));

vi.mock("../api/candidate", () => ({
  getCandidateApplications: vi.fn(() => Promise.resolve([])),
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
    getOpportunity.mockResolvedValue(apiOpportunity);
    getOpportunities.mockResolvedValue([]);
    applyToOpportunity.mockResolvedValue(appliedSummary);
    getCandidateApplications.mockResolvedValue([]);
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
