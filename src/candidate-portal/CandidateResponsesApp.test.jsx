import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  confirmCandidateApplication,
  getCandidateApplications,
  withdrawCandidateApplication,
} from "../api/candidate";
import { CandidateResponsesApp } from "./CandidateResponsesApp";
import { resetCandidateApplicationsStore } from "./candidate-applications-store";

vi.mock("../api/candidate", () => ({
  getCandidateApplications: vi.fn(() => Promise.resolve([])),
  withdrawCandidateApplication: vi.fn(() => Promise.resolve({})),
  confirmCandidateApplication: vi.fn(() => Promise.resolve({})),
}));

const submittedApplication = {
  id: 14,
  opportunityId: 101,
  status: "submitted",
  employerNote: null,
  appliedAt: "2026-03-12T12:00:00Z",
  opportunityTitle: "Junior Security Analyst",
  opportunityType: "vacancy",
  companyName: "ООО Компани",
  locationCity: "Москва",
  employmentType: "online",
  opportunityDeleted: false,
  moderationStatus: "approved",
};

const invitedApplication = {
  id: 28,
  opportunityId: 202,
  status: "invited",
  employerNote: null,
  appliedAt: "2026-03-12T12:00:00Z",
  opportunityTitle: "Летняя школа SOC",
  opportunityType: "internship",
  companyName: "ООО Компани",
  locationCity: "Москва",
  employmentType: "online",
  opportunityDeleted: false,
  moderationStatus: "approved",
};

const rejectedApplicationWithNote = {
  id: 42,
  opportunityId: 303,
  status: "rejected",
  employerNote: "Потренируйтесь ещё над алгоритмами.",
  appliedAt: "2026-03-12T12:00:00Z",
  opportunityTitle: "Middle Frontend Developer",
  opportunityType: "vacancy",
  companyName: "ООО Компани",
  locationCity: "Москва",
  employmentType: "online",
  opportunityDeleted: false,
  moderationStatus: "approved",
};

function renderApp() {
  return render(
    <MemoryRouter>
      <CandidateResponsesApp />
    </MemoryRouter>
  );
}

describe("CandidateResponsesApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCandidateApplicationsStore();
    getCandidateApplications.mockResolvedValue([]);
  });

  it("renders candidate response cards with fallback copy and status actions", async () => {
    getCandidateApplications.mockResolvedValue([submittedApplication, invitedApplication]);

    renderApp();

    expect(await screen.findByText("Junior Security Analyst")).toBeInTheDocument();
    expect(screen.getByText("Летняя школа SOC")).toBeInTheDocument();
    expect(screen.getByText("Ваша заявка отправлена, ожидайте ответа от компании.")).toBeInTheDocument();
    expect(screen.getByText("Поздравляем! Ваша заявка была принята. Подтвердите ваше участие.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отменить отклик" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Подтвердить участие" })).toBeInTheDocument();
  });

  it("withdraws an application and removes the candidate action", async () => {
    getCandidateApplications.mockResolvedValue([submittedApplication]);
    withdrawCandidateApplication.mockResolvedValue({
      ...submittedApplication,
      status: "withdrawn",
    });

    renderApp();

    const withdrawButton = await screen.findByRole("button", { name: "Отменить отклик" });
    fireEvent.click(withdrawButton);

    const confirmButton = await screen.findByRole("button", { name: "Да, отменить" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(withdrawCandidateApplication).toHaveBeenCalledWith(submittedApplication.id);
    });

    expect(await screen.findByText("Удалено")).toBeInTheDocument();
    expect(screen.getByText("Вы отменили отклик.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Отменить отклик" })).not.toBeInTheDocument();
  });

  it("shows confirmation modal on withdraw and does not withdraw if canceled", async () => {
    getCandidateApplications.mockResolvedValue([submittedApplication]);

    renderApp();

    const withdrawButton = await screen.findByRole("button", { name: "Отменить отклик" });
    fireEvent.click(withdrawButton);

    expect(screen.getByText("Вы уверены, что хотите отменить отклик? Действие нельзя будет вернуть. При повторном отправлении отклика он будет рассмотрен полностью заново.")).toBeInTheDocument();

    const backButton = screen.getByRole("button", { name: "Назад" });
    fireEvent.click(backButton);

    expect(withdrawCandidateApplication).not.toHaveBeenCalled();
  });

  it("confirms an invited application and updates the status in place", async () => {
    getCandidateApplications.mockResolvedValue([invitedApplication]);
    confirmCandidateApplication.mockResolvedValue({
      ...invitedApplication,
      status: "accepted",
    });

    renderApp();

    const confirmButton = await screen.findByRole("button", { name: "Подтвердить участие" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(confirmCandidateApplication).toHaveBeenCalledWith(invitedApplication.id);
    });

    expect(await screen.findByText("Принято")).toBeInTheDocument();
    expect(screen.getByText("Ваше участие подтверждено.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Подтвердить участие" })).not.toBeInTheDocument();
  });

  it("renders rejected application card with employer note", async () => {
    getCandidateApplications.mockResolvedValue([rejectedApplicationWithNote]);

    renderApp();

    expect(await screen.findByText("Middle Frontend Developer")).toBeInTheDocument();
    expect(screen.getByText("Компания завершила рассмотрение отклика.")).toBeInTheDocument();
    expect(screen.getByText("Комментарий организатора:")).toBeInTheDocument();
    expect(screen.getByText("Потренируйтесь ещё над алгоритмами.")).toBeInTheDocument();
  });

  it("sorts applications correctly based on selected sorting option", async () => {
    const earlyApp = {
      ...submittedApplication,
      id: 1,
      opportunityTitle: "Alpha vacancy",
      appliedAt: "2026-01-01T10:00:00Z",
    };
    const lateApp = {
      ...submittedApplication,
      id: 2,
      opportunityTitle: "Beta vacancy",
      appliedAt: "2026-03-01T10:00:00Z",
    };
    const invitedApp = {
      ...invitedApplication,
      id: 3,
      opportunityTitle: "Gamma vacancy",
      appliedAt: "2026-02-01T10:00:00Z",
    };

    getCandidateApplications.mockResolvedValue([earlyApp, lateApp, invitedApp]);

    renderApp();

    // Default sorting is 'attention' (invited first, then recency: lateApp (March), earlyApp (Jan))
    await screen.findByText("Alpha vacancy");
    
    let cards = screen.getAllByRole("heading", { level: 3 });
    expect(cards[0].textContent).toBe("Gamma vacancy"); // invited
    expect(cards[1].textContent).toBe("Beta vacancy"); // lateApp
    expect(cards[2].textContent).toBe("Alpha vacancy"); // earlyApp

    // Change sorting to 'newest' (lateApp (March), invitedApp (Feb), earlyApp (Jan))
    const sortTrigger = screen.getByRole("button", { name: "Сортировка" });
    fireEvent.click(sortTrigger);
    
    const newestOption = screen.getByRole("option", { name: "Сначала новые" });
    fireEvent.click(newestOption);

    cards = screen.getAllByRole("heading", { level: 3 });
    expect(cards[0].textContent).toBe("Beta vacancy");
    expect(cards[1].textContent).toBe("Gamma vacancy");
    expect(cards[2].textContent).toBe("Alpha vacancy");

    // Change sorting to 'title' (Alpha, Beta, Gamma)
    fireEvent.click(sortTrigger);
    const titleOption = screen.getByRole("option", { name: "По названию" });
    fireEvent.click(titleOption);

    cards = screen.getAllByRole("heading", { level: 3 });
    expect(cards[0].textContent).toBe("Alpha vacancy");
    expect(cards[1].textContent).toBe("Beta vacancy");
    expect(cards[2].textContent).toBe("Gamma vacancy");
  });
});
