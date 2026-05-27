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
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../../../api/notifications";
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

vi.mock("../../../api/notifications", () => ({
  getNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
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
    getNotifications.mockResolvedValue([]);
    markNotificationRead.mockResolvedValue({});
    markAllNotificationsRead.mockResolvedValue({});
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
          navItems={[{ key: "home", label: "Главная", href: routes.home }]}
          currentKey="home"
          actionHref={routes.auth.login}
          actionLabel="Войти / Регистрация"
        />
      </MemoryRouter>
    );

    expect(screen.queryByRole("link", { name: "Войти / Регистрация" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Меню аккаунта/i }));

    expect(screen.getByRole("menuitem", { name: "Мой кабинет" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: "Выйти" }));

    await waitFor(() => {
      expect(logoutCurrentAuthUser).toHaveBeenCalledTimes(1);
    });
  });

  it("shows stored notifications for non-candidate users and marks them as read", async () => {
    getNotifications.mockResolvedValue([
      {
        id: 91,
        title: "Новая жалоба на возможность",
        message: "Проверьте публикацию Junior Security Analyst",
        link: routes.moderator.complaints,
        isRead: false,
        createdAt: "2026-03-20T10:00:00Z",
      },
    ]);

    render(
      <MemoryRouter>
        <PortalHeader
          navItems={[
            { key: "home", label: "Главная", href: routes.home },
          ]}
          currentKey="home"
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Уведомления" }));

    expect(await screen.findByRole("dialog", { name: "Уведомления" })).toBeInTheDocument();
    expect(await screen.findByText("Новая жалоба на возможность")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Открыть" })).toHaveAttribute("href", routes.moderator.complaints);

    fireEvent.click(screen.getByRole("button", { name: "Прочитано" }));

    await waitFor(() => {
      expect(markNotificationRead).toHaveBeenCalledWith(91);
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

    getNotifications.mockResolvedValue([]);
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
          navItems={[{ key: "home", label: "Главная", href: routes.home }]}
          currentKey="home"
          actionHref={routes.candidate.profile}
          actionLabel="Профиль"
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Уведомления" }));

    expect(await screen.findByRole("dialog", { name: "Уведомления" })).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Все действия" })).toHaveAttribute("href", "/candidate/contacts?tab=incoming");

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
          navItems={[{ key: "home", label: "Главная", href: routes.home }]}
          currentKey="home"
          actionHref={routes.candidate.profile}
          actionLabel="Профиль"
          variant="public-profile"
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Профиль" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Уведомления" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Меню аккаунта/i })).not.toBeInTheDocument();
  });

  it("opens and closes the mobile navigation menu", () => {
    render(
      <MemoryRouter>
        <PortalHeader
          navItems={[
            { key: "home", label: "Главная", href: routes.home },
            { key: "about", label: "О платформе", href: routes.homeAbout },
          ]}
          currentKey="home"
          actionHref={routes.auth.login}
          actionLabel="Войти / Регистрация"
        />
      </MemoryRouter>
    );

    expect(screen.queryByRole("navigation", { name: "Мобильная навигация" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Открыть меню навигации" }));

    expect(screen.getByRole("navigation", { name: "Мобильная навигация" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "О платформе" }).length).toBeGreaterThan(0);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("navigation", { name: "Мобильная навигация" })).not.toBeInTheDocument();
  });

  it("filters out career nav item for companies and moderators/admins", () => {
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

    const navItems = [
      { key: "home", label: "Главная", href: routes.home },
      { key: "career", label: "Карьера", href: routes.candidate.career },
    ];

    const { rerender } = render(
      <MemoryRouter>
        <PortalHeader navItems={navItems} currentKey="home" />
      </MemoryRouter>
    );

    expect(screen.queryByRole("link", { name: "Карьера" })).not.toBeInTheDocument();

    useAuthSession.mockReturnValue({
      status: "authenticated",
      user: {
        id: 8,
        role: "company",
        email: "company@tramplin.test",
        displayName: "Company",
      },
      error: null,
    });

    rerender(
      <MemoryRouter>
        <PortalHeader navItems={navItems} currentKey="home" />
      </MemoryRouter>
    );

    expect(screen.queryByRole("link", { name: "Карьера" })).not.toBeInTheDocument();

    useAuthSession.mockReturnValue({
      status: "authenticated",
      user: {
        id: 9,
        role: "candidate",
        email: "candidate@tramplin.test",
        displayName: "Candidate",
      },
      error: null,
    });

    rerender(
      <MemoryRouter>
        <PortalHeader navItems={navItems} currentKey="home" />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Карьера" })).toBeInTheDocument();
  });

  it("hides profile/cabinet action button for authenticated users when not in public-profile variant", () => {
    useAuthSession.mockReturnValue({
      status: "authenticated",
      user: {
        id: 9,
        role: "candidate",
        email: "candidate@tramplin.test",
        displayName: "Candidate",
      },
      error: null,
    });

    render(
      <MemoryRouter>
        <PortalHeader
          navItems={[]}
          actionHref={routes.candidate.profile}
          actionLabel="Профиль"
        />
      </MemoryRouter>
    );

    expect(screen.queryByRole("link", { name: "Профиль" })).not.toBeInTheDocument();
  });

  it("shows an auth prompt modal when unauthenticated users click restricted buttons", async () => {
    useAuthSession.mockReturnValue({
      status: "unauthenticated",
      user: null,
      error: null,
    });

    render(
      <MemoryRouter>
        <PortalHeader
          navItems={[]}
          actionHref={routes.auth.login}
          actionLabel="Войти / Регистрация"
        />
      </MemoryRouter>
    );

    // Clicking "Уведомления" should open the modal
    fireEvent.click(screen.getByRole("button", { name: "Уведомления" }));

    expect(screen.getByRole("dialog", { name: "Требуется авторизация" })).toBeInTheDocument();
    expect(screen.getByText("Чтобы общаться и просматривать уведомления, пожалуйста, войдите в систему.")).toBeInTheDocument();

    // The cancel button should close the modal
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(screen.queryByRole("dialog", { name: "Требуется авторизация" })).not.toBeInTheDocument();

    // Clicking "Сообщения" should open the modal again
    fireEvent.click(screen.getByRole("button", { name: "Сообщения" }));
    expect(screen.getByRole("dialog", { name: "Требуется авторизация" })).toBeInTheDocument();

    // The login link should point to the login page
    const loginLink = screen.getByRole("link", { name: "Войти" });
    expect(loginLink).toHaveAttribute("href", expect.stringContaining(routes.auth.login));
  });
});
