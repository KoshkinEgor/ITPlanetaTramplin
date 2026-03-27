import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CandidateContactsApp } from "./CandidateContactsApp";
import {
  acceptCandidateFriendRequest,
  deleteCandidateFriend,
  getCandidateContacts,
  getCandidateFriendRequests,
  getCandidateFriends,
  getCandidateProjectInvites,
} from "../api/candidate";
import { useAuthSession } from "../auth/api";

vi.mock("../api/candidate", () => ({
  getCandidateContacts: vi.fn(),
  getCandidateFriends: vi.fn(),
  getCandidateFriendRequests: vi.fn(),
  getCandidateProjectInvites: vi.fn(),
  deleteCandidateContact: vi.fn(),
  deleteCandidateFriend: vi.fn(),
  acceptCandidateFriendRequest: vi.fn(),
  declineCandidateFriendRequest: vi.fn(),
  acceptCandidateProjectInvite: vi.fn(),
  declineCandidateProjectInvite: vi.fn(),
  cancelCandidateProjectInvite: vi.fn(),
}));

vi.mock("../auth/api", () => ({
  useAuthSession: vi.fn(),
}));

function renderApp(initialEntry = "/candidate/contacts") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <CandidateContactsApp />
    </MemoryRouter>
  );
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
    getCandidateContacts.mockResolvedValue([]);
    getCandidateFriends.mockResolvedValue([]);
    getCandidateFriendRequests.mockResolvedValue([]);
    getCandidateProjectInvites.mockResolvedValue([]);
    acceptCandidateFriendRequest.mockResolvedValue({});
    deleteCandidateFriend.mockResolvedValue({});
  });

  it("opens the incoming tab from query params and accepts friend requests", async () => {
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

    renderApp("/candidate/contacts?tab=incoming");

    expect(await screen.findByRole("tab", { name: /Входящие/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Мария Соколова")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Принять" }));

    await waitFor(() => {
      expect(acceptCandidateFriendRequest).toHaveBeenCalledWith(17);
    });
  });

  it("filters project invites between pending and history states", async () => {
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
      {
        id: 32,
        senderUserId: 7,
        recipientUserId: 55,
        status: "accepted",
        projectTitle: "Portfolio Refresh",
        role: "Designer",
        createdAt: "2026-03-05T10:00:00Z",
        counterparty: {
          userId: 55,
          name: "Илья Смирнов",
          email: "ilya@tramplin.local",
          skills: ["Figma"],
          relationship: {
            contactState: "saved",
            friendState: "friends",
            projectInviteState: "accepted",
          },
        },
      },
    ]);

    renderApp("/candidate/contacts?tab=project-invites");

    expect(await screen.findByText("Анна Ковалёва")).toBeInTheDocument();
    expect(screen.queryByText("Илья Смирнов")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "История" }));

    expect(await screen.findByText("Илья Смирнов")).toBeInTheDocument();
    expect(screen.queryByText("Анна Ковалёва")).not.toBeInTheDocument();
  });

  it("falls back to contacts-only mode when optional social endpoints return 404", async () => {
    getCandidateContacts.mockResolvedValue([
      {
        userId: 42,
        contactProfileId: 42,
        name: "Мария Соколова",
        email: "maria@tramplin.local",
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

    renderApp("/candidate/contacts");

    expect(await screen.findByText("Мария Соколова")).toBeInTheDocument();
    expect(screen.getByText("Часть social-возможностей пока недоступна")).toBeInTheDocument();
    expect(screen.queryByText("Не удалось загрузить social hub")).not.toBeInTheDocument();
  });
});
