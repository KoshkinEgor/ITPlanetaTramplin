import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routes } from "../../../app/routes";
import { logoutCurrentAuthUser, useAuthSession } from "../../../auth/api";
import { PortalHeader } from "./PortalHeader";

vi.mock("../../../auth/api", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useAuthSession: vi.fn(),
    logoutCurrentAuthUser: vi.fn(() => Promise.resolve({})),
  };
});

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
});
