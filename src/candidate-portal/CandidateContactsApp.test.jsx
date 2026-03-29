import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CandidateContactsApp } from "./CandidateContactsApp";
import {
  acceptCandidateFriendRequest,
  acceptCandidateProjectInvite,
  cancelCandidateFriendRequest,
  cancelCandidateProjectInvite,
  createCandidateContact,
  createCandidateFriendRequest,
  declineCandidateFriendRequest,
  declineCandidateProjectInvite,
  deleteCandidateContact,
  deleteCandidateFriend,
  getCandidateApplications,
  getCandidateContactSuggestions,
  getCandidateContacts,
  getCandidateDirectory,
  getCandidateFriendRequests,
  getCandidateFriends,
  getCandidateOpportunityShares,
  getCandidateProfile,
  getCandidateProjectInvites,
} from "../api/candidate";
import { getOpportunity } from "../api/opportunities";
import { useAuthSession } from "../auth/api";

vi.mock("../api/candidate", () => ({
  acceptCandidateFriendRequest: vi.fn(),
  acceptCandidateProjectInvite: vi.fn(),
  cancelCandidateFriendRequest: vi.fn(),
  cancelCandidateProjectInvite: vi.fn(),
  createCandidateContact: vi.fn(),
  createCandidateFriendRequest: vi.fn(),
  declineCandidateFriendRequest: vi.fn(),
  declineCandidateProjectInvite: vi.fn(),
  deleteCandidateContact: vi.fn(),
  deleteCandidateFriend: vi.fn(),
  getCandidateApplications: vi.fn(),
  getCandidateContactSuggestions: vi.fn(),
  getCandidateContacts: vi.fn(),
  getCandidateDirectory: vi.fn(),
  getCandidateFriendRequests: vi.fn(),
  getCandidateFriends: vi.fn(),
  getCandidateOpportunityShares: vi.fn(),
  getCandidateProfile: vi.fn(),
  getCandidateProjectInvites: vi.fn(),
}));

vi.mock("../auth/api", () => ({
  useAuthSession: vi.fn(),
}));

vi.mock("../api/opportunities", () => ({
  getOpportunity: vi.fn(),
}));

function renderApp(initialEntry = "/candidate/contacts") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <CandidateContactsApp />
    </MemoryRouter>
  );
}

function createBaseProfile() {
  return {
    id: 7,
    name: "Анна",
    surname: "Иванова",
    skills: ["UX", "Research"],
    links: {
      onboarding: {
        city: "Москва",
      },
    },
  };
}

function primeBaseMocks() {
  getCandidateContacts.mockResolvedValue([]);
  getCandidateDirectory.mockResolvedValue([]);
  getCandidateFriends.mockResolvedValue([]);
  getCandidateFriendRequests.mockResolvedValue([]);
  getCandidateProjectInvites.mockResolvedValue([]);
  getCandidateOpportunityShares.mockResolvedValue([]);
  getCandidateContactSuggestions.mockResolvedValue([]);
  getOpportunity.mockResolvedValue(null);
  getCandidateProfile.mockResolvedValue(createBaseProfile());
  getCandidateApplications.mockResolvedValue([
    {
      id: 100,
      opportunityId: 900,
      opportunityTags: ["UX", "Research"],
    },
  ]);
  acceptCandidateFriendRequest.mockResolvedValue({});
  acceptCandidateProjectInvite.mockResolvedValue({});
  cancelCandidateFriendRequest.mockResolvedValue({});
  cancelCandidateProjectInvite.mockResolvedValue({});
  createCandidateContact.mockResolvedValue({});
  createCandidateFriendRequest.mockResolvedValue({});
  declineCandidateFriendRequest.mockResolvedValue({});
  declineCandidateProjectInvite.mockResolvedValue({});
  deleteCandidateContact.mockResolvedValue({});
  deleteCandidateFriend.mockResolvedValue({});
}

describe("CandidateContactsApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthSession.mockReturnValue({
      status: "authenticated",
      user: {
        id: 7,
        role: "candidate",
        email: "candidate@tramplin.local",
      },
      error: null,
    });
    primeBaseMocks();
  });

  it("opens the actual tab from query params and accepts incoming friend requests", async () => {
    getCandidateFriendRequests.mockResolvedValue([
      {
        id: 17,
        senderUserId: 42,
        recipientUserId: 7,
        status: "pending",
        createdAt: "2026-03-12T10:00:00Z",
        counterparty: {
          userId: 42,
          name: "Мария Соколова",
          email: "maria@tramplin.local",
          skills: ["UX", "Research"],
          relationship: {
            contactState: "none",
            friendState: "incoming",
            projectInviteState: "none",
            friendRequestId: 17,
          },
        },
      },
    ]);

    renderApp("/candidate/contacts?tab=actual");

    expect(await screen.findByRole("tab", { name: /Актуальные/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Мария Соколова")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Принять" }));

    await waitFor(() => {
      expect(acceptCandidateFriendRequest).toHaveBeenCalledWith(17);
    });
  });

  it("shows suggestions in search and allows adding a person to contacts inline", async () => {
    getCandidateContactSuggestions.mockResolvedValue([
      {
        userId: 42,
        name: "Мария Соколова",
        email: "maria@tramplin.local",
        city: "Москва",
        skills: ["UX", "Research"],
        reasons: ["Общие навыки: UX, Research"],
        relationship: {
          contactState: "none",
          friendState: "none",
          projectInviteState: "none",
        },
      },
    ]);
    getCandidateDirectory.mockResolvedValue([
      {
        userId: 42,
        name: "Мария Соколова",
        email: "maria@tramplin.local",
        city: "Москва",
        skills: ["UX", "Research"],
        relationship: {
          contactState: "none",
          friendState: "none",
          projectInviteState: "none",
        },
      },
      {
        userId: 55,
        name: "Илья Смирнов",
        email: "ilya@tramplin.local",
        city: "Казань",
        skills: ["React"],
        relationship: {
          contactState: "none",
          friendState: "none",
          projectInviteState: "none",
        },
      },
    ]);

    renderApp("/candidate/contacts?tab=search");

    expect(await screen.findByRole("tab", { name: /Поиск/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Люди для вас")).toBeInTheDocument();
    expect(screen.getAllByText("Мария Соколова").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByRole("searchbox", { name: "Поиск кандидатов" }), {
      target: { value: "Илья" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Найти" }));

    await waitFor(() => {
      expect(screen.getByText("Илья Смирнов")).toBeInTheDocument();
    });
    expect(screen.queryByText("Мария Соколова")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Добавить в контакты" }));

    await waitFor(() => {
      expect(createCandidateContact).toHaveBeenCalledWith({ userId: 55 });
    });
  });

  it("switches the network tab to invites and accepts a project invite", async () => {
    getCandidateProjectInvites.mockResolvedValue([
      {
        id: 31,
        senderUserId: 99,
        recipientUserId: 7,
        status: "pending",
        projectTitle: "Discovery Sprint",
        role: "UX researcher",
        createdAt: "2026-03-10T10:00:00Z",
        counterparty: {
          userId: 99,
          name: "Анна Ковалёва",
          email: "anna@tramplin.local",
          skills: ["Research"],
          relationship: {
            contactState: "saved",
            friendState: "none",
            projectInviteState: "incoming",
            projectInviteId: 31,
          },
        },
      },
    ]);

    renderApp("/candidate/contacts?tab=network");

    expect(await screen.findByRole("tab", { name: /Моя сеть/i })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("button", { name: "Инвайты" }));

    expect(await screen.findByText("Анна Ковалёва")).toBeInTheDocument();
    expect(screen.getByText(/Discovery Sprint/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Принять инвайт" }));

    await waitFor(() => {
      expect(acceptCandidateProjectInvite).toHaveBeenCalledWith(31);
    });
  });

  it("shows incoming shared opportunities as mini cards on the contacts page", async () => {
    getCandidateOpportunityShares.mockResolvedValue([
      {
        id: 51,
        senderUserId: 42,
        recipientUserId: 7,
        opportunityId: 900,
        opportunityTitle: "Frontend internship",
        note: "Посмотри, тебе должно зайти по стеку.",
        createdAt: "2026-03-18T10:00:00Z",
        counterparty: {
          userId: 42,
          name: "Мария Соколова",
          email: "maria@tramplin.local",
          skills: ["React", "TypeScript"],
          relationship: {
            contactState: "saved",
            friendState: "none",
            projectInviteState: "none",
          },
        },
      },
    ]);
    getOpportunity.mockResolvedValue({
      id: 900,
      title: "Frontend internship",
      companyName: "Sber Start",
      locationCity: "Москва",
      opportunityType: "internship",
      employmentType: "hybrid",
      duration: "3 месяца",
      isPaid: true,
      stipendFrom: 60000,
      stipendTo: 80000,
      moderationStatus: "approved",
      tags: ["React", "TypeScript"],
    });

    renderApp("/candidate/contacts?tab=actual");

    expect(await screen.findByText("Возможности, которые вам посоветовали")).toBeInTheDocument();

    const shareSection = screen.getByText("Возможности, которые вам посоветовали").closest("section");
    expect(shareSection).not.toBeNull();
    expect(within(shareSection).getByText("Мария Соколова")).toBeInTheDocument();
    expect(within(shareSection).getByText("Frontend internship")).toBeInTheDocument();
    expect(within(shareSection).getByRole("link", { name: "К возможности" })).toHaveAttribute("href", "/opportunities/900");
  });

  it("keeps the hub usable when optional social endpoints are unavailable", async () => {
    getCandidateContacts.mockResolvedValue([
      {
        userId: 42,
        contactProfileId: 42,
        name: "Мария Соколова",
        email: "maria@tramplin.local",
        city: "Москва",
        skills: ["UX"],
        relationship: {
          contactState: "saved",
          friendState: "none",
          projectInviteState: "none",
        },
      },
    ]);
    getCandidateDirectory.mockResolvedValue([
      {
        userId: 42,
        name: "Мария Соколова",
        email: "maria@tramplin.local",
        city: "Москва",
        skills: ["UX"],
        relationship: {
          contactState: "saved",
          friendState: "none",
          projectInviteState: "none",
        },
      },
    ]);
    getCandidateFriends.mockRejectedValue({ status: 404 });
    getCandidateFriendRequests.mockRejectedValue({ status: 404 });
    getCandidateProjectInvites.mockRejectedValue({ status: 404 });
    getCandidateOpportunityShares.mockRejectedValue({ status: 404 });
    getCandidateContactSuggestions.mockRejectedValue({ status: 404 });

    renderApp("/candidate/contacts?tab=network");

    expect(await screen.findByText("Мария Соколова")).toBeInTheDocument();
    expect(screen.getByText("Часть social-возможностей пока недоступна")).toBeInTheDocument();
    expect(screen.queryByText("Не удалось загрузить social hub")).not.toBeInTheDocument();
  });
});
