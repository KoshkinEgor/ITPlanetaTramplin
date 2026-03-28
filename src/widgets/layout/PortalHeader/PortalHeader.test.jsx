import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routes } from "../../../app/routes";
import { logoutCurrentAuthUser, useAuthSession } from "../../../auth/api";
import {
  acceptCandidateFriendRequest,
  acceptCandidateProjectInvite,
  declineCandidateFriendRequest,
  declineCandidateProjectInvite,
  getCandidateFriendRequests,
  getCandidateProjectInvites,
} from "../../../api/candidate";
import { PortalHeader } from "./PortalHeader";

vi.mock("../../../auth/api", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useAuthSession: vi.fn(),
    logoutCurrentAuthUser: vi.fn(() => Promise.resolve({})),
  };
});

vi.mock("../../../api/candidate", () => ({
  getCandidateFriendRequests: vi.fn(),
  getCandidateProjectInvites: vi.fn(),
  acceptCandidateFriendRequest: vi.fn(),
  declineCandidateFriendRequest: vi.fn(),
  acceptCandidateProjectInvite: vi.fn(),
  declineCandidateProjectInvite: vi.fn(),
}));

describe("PortalHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthSession.mockReturnValue({
      status: "authenticated",
      user: {
        id: 7,
        role: "moderator",
        email: "moderator@tramplin.test",
        displayName: "Moderator",
      },
      error: null,
    });
    logoutCurrentAuthUser.mockResolvedValue({});
    getCandidateFriendRequests.mockResolvedValue([]);
    getCandidateProjectInvites.mockResolvedValue([]);
    acceptCandidateFriendRequest.mockResolvedValue({});
    declineCandidateFriendRequest.mockResolvedValue({});
    acceptCandidateProjectInvite.mockResolvedValue({});
    declineCandidateProjectInvite.mockResolvedValue({});
  });

  it("shows the account menu for authenticated users and lets them log out", async () => {
    render(
      <MemoryRouter>
        <PortalHeader
          navItems={[
            { key: "home", label: "Главная", href: routes.home },
          ]}
          currentKey="home"
          actionHref={routes.auth.login}
          actionLabel="Войти / Регистрация"
        />
      </MemoryRouter>
    );

    expect(screen.queryByText("Войти / Регистрация")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /меню аккаунта/i }));

    expect(screen.getByRole("menuitem", { name: "Мой кабинет" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: "Выйти" }));

    await waitFor(() => {
      expect(logoutCurrentAuthUser).toHaveBeenCalledTimes(1);
    });
  });

  it("shows candidate notifications in the bell panel and handles quick actions", async () => {
    useAuthSession.mockReturnValue({
      status: "authenticated",
      user: {
        id: 7,
        role: "candidate",
        email: "candidate@tramplin.local",
        displayName: "Candidate",
      },
      error: null,
    });

    getCandidateFriendRequests.mockResolvedValue([
      {
        id: 17,
        senderUserId: 42,
        recipientUserId: 7,
        status: "pending",
        createdAt: "2026-03-20T10:00:00Z",
        counterparty: {
          userId: 42,
          name: "Мария Соколова",
          email: "maria@tramplin.local",
        },
      },
    ]);
    getCandidateProjectInvites.mockResolvedValue([
      {
        id: 33,
        senderUserId: 55,
        recipientUserId: 7,
        status: "pending",
        createdAt: "2026-03-19T10:00:00Z",
        projectTitle: "Discovery Sprint",
        counterparty: {
          userId: 55,
          name: "Анна Ковалёва",
          email: "anna@tramplin.local",
        },
      },
    ]);

    render(
      <MemoryRouter>
        <PortalHeader
          navItems={[
            { key: "home", label: "Главная", href: routes.home },
          ]}
          currentKey="home"
          actionHref={routes.candidate.profile}
          actionLabel="Профиль"
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Уведомления" }));

    expect(await screen.findByRole("dialog", { name: "Уведомления" })).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Посмотреть все" })).toHaveAttribute("href", "/candidate/contacts?tab=incoming");

    const friendItem = screen.getByText(/Мария Соколова/).closest("article");
    expect(friendItem).not.toBeNull();

    fireEvent.click(within(friendItem).getByRole("button", { name: "Принять" }));

    await waitFor(() => {
      expect(acceptCandidateFriendRequest).toHaveBeenCalledWith(17);
    });
  });

  it("hides the account menu in public-profile variant while keeping public actions", () => {
    useAuthSession.mockReturnValue({
      status: "authenticated",
      user: {
        id: 7,
        role: "candidate",
        email: "candidate@tramplin.local",
        displayName: "Candidate",
      },
      error: null,
    });

    render(
      <MemoryRouter>
        <PortalHeader
          navItems={[
            { key: "home", label: "Главная", href: routes.home },
          ]}
          currentKey="home"
          actionHref={routes.candidate.profile}
          actionLabel="Профиль"
          variant="public-profile"
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Профиль" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Уведомления" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /меню аккаунта/i })).not.toBeInTheDocument();
  });
});
