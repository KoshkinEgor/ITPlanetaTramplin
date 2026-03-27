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

    await waitFor(() => {
      expect(withdrawCandidateApplication).toHaveBeenCalledWith(submittedApplication.id);
    });

    expect(await screen.findByText("Удалено")).toBeInTheDocument();
    expect(screen.getByText("Вы отменили отклик.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Отменить отклик" })).not.toBeInTheDocument();
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
});
