import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCompanyOpportunities,
  getOpportunityApplications,
  updateOpportunityApplicationStatus,
} from "../api/company";
import { CompanyResponsesSection } from "./CompanyResponsesSection";

vi.mock("../api/company", () => ({
  getCompanyOpportunities: vi.fn(),
  getOpportunityApplications: vi.fn(),
  updateOpportunityApplicationStatus: vi.fn(),
}));

const opportunities = [
  {
    id: 101,
    title: "Инженер дизайн-систем",
  },
];

const application = {
  id: 7,
  opportunityId: 101,
  candidateUserId: 42,
  candidateName: "Anna Petrova",
  candidateEmail: "anna.petrova@tramplin.local",
  candidateDescription: "Frontend-разработчик с фокусом на библиотеки компонентов и доступность.",
  candidateSkills: ["React", "Accessibility", "Design Systems"],
  status: "submitted",
  employerNote: "",
  appliedAt: "2026-03-27T12:00:00.000Z",
};

const invitedApplication = {
  id: 8,
  opportunityId: 101,
  candidateUserId: 77,
  candidateName: "Ivan Smirnov",
  candidateEmail: "ivan.smirnov@tramplin.local",
  candidateDescription: "Кандидат на стажировку по аналитике безопасности.",
  candidateSkills: ["SOC", "Python"],
  status: "invited",
  employerNote: "",
  appliedAt: "2026-03-27T13:00:00.000Z",
};

function renderSection() {
  return render(
    <MemoryRouter>
      <CompanyResponsesSection />
    </MemoryRouter>
  );
}

async function findResponsesCard(name = "Anna Petrova") {
  const sectionHeading = await screen.findByRole("heading", { name: "Отклики кандидатов" });
  const section = sectionHeading.closest("article");
  const nameNode = within(section).getByText(name);

  return nameNode.closest("article");
}

describe("CompanyResponsesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCompanyOpportunities.mockResolvedValue(opportunities);
    getOpportunityApplications.mockResolvedValue([application, invitedApplication]);
    updateOpportunityApplicationStatus.mockResolvedValue({
      id: 7,
      opportunityId: 101,
      candidateUserId: 42,
      candidateName: "Anna Petrova",
      candidateEmail: "anna.petrova@tramplin.local",
      status: "submitted",
      employerNote: "Приглашаем на интервью",
    });
  });

  it("renders one responses list with filters and hides the summary block", async () => {
    renderSection();

    const card = await findResponsesCard();
    const cardScope = within(card);
    const toggle = cardScope.getByRole("button", { expanded: false });
    const section = (await screen.findByRole("heading", { name: "Отклики кандидатов" })).closest("article");
    const filterToolbar = within(section).getByRole("toolbar", { name: "Фильтр откликов" });

    expect(cardScope.queryByText("Статус отклика")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Последние отклики" })).not.toBeInTheDocument();
    expect(within(filterToolbar).getByRole("button", { name: /Все/i })).toBeInTheDocument();
    expect(within(filterToolbar).getByRole("button", { name: /Отправлено/i })).toBeInTheDocument();
    expect(within(filterToolbar).getByRole("button", { name: /Приглашение/i })).toBeInTheDocument();

    const profileLink = cardScope.getByRole("link", { name: "Профиль" });
    const resumeLink = cardScope.getByRole("link", { name: "Резюме" });

    expect(profileLink.getAttribute("href")).toContain("/candidate/public?");
    expect(profileLink.getAttribute("href")).toContain("userId=42");
    expect(resumeLink.getAttribute("href")).toContain("#resume");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(await cardScope.findByText("Статус отклика")).toBeInTheDocument();
    expect(cardScope.getByText("Комментарий работодателя")).toBeInTheDocument();
    expect(cardScope.getByRole("button", { name: "Обновить отклик" })).toBeInTheDocument();

    fireEvent.click(within(filterToolbar).getByRole("button", { name: /Приглашение/i }));

    await screen.findByText("Ivan Smirnov");
    expect(within(section).queryByText("Anna Petrova")).not.toBeInTheDocument();
  });

  it("saves employer comment from the expanded response card", async () => {
    renderSection();

    const card = await findResponsesCard();
    const cardScope = within(card);

    fireEvent.click(cardScope.getByRole("button", { expanded: false }));

    const commentField = await cardScope.findByRole("textbox", { name: "Комментарий работодателя" });
    fireEvent.change(commentField, { target: { value: "Приглашаем на интервью" } });
    fireEvent.click(cardScope.getByRole("button", { name: "Обновить отклик" }));

    await waitFor(() => {
      expect(updateOpportunityApplicationStatus).toHaveBeenCalledWith(101, 7, {
        status: "submitted",
        employerNote: "Приглашаем на интервью",
      });
    });

    expect(await screen.findByText("Отклик обновлён")).toBeInTheDocument();
  });
});
