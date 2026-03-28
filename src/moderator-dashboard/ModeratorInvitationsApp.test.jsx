import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthSession } from "../auth/api";
import { createModeratorInvitation, getModeratorInvitations } from "../api/moderation";
import { ModeratorInvitationsApp } from "./ModeratorInvitationsApp";

vi.mock("../auth/api", () => ({
  useAuthSession: vi.fn(),
}));

vi.mock("../api/moderation", () => ({
  createModeratorInvitation: vi.fn(),
  getModeratorInvitations: vi.fn(),
}));

describe("ModeratorInvitationsApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getModeratorInvitations.mockResolvedValue([]);
    createModeratorInvitation.mockResolvedValue({ message: "ok" });
    useAuthSession.mockReturnValue({
      status: "authenticated",
      user: {
        id: 7,
        role: "moderator",
        isAdministrator: false,
      },
      error: null,
    });
  });

  it("hides the invitation form for non-admin moderators", async () => {
    render(<ModeratorInvitationsApp />);

    expect(await screen.findByText(/создание приглашений ограничено/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Отправить приглашение" })).not.toBeInTheDocument();
  });

  it("shows the invitation form for administrator and submits new invitations", async () => {
    useAuthSession.mockReturnValue({
      status: "authenticated",
      user: {
        id: 1,
        role: "moderator",
        isAdministrator: true,
      },
      error: null,
    });

    render(<ModeratorInvitationsApp />);

    fireEvent.change(await screen.findByLabelText(/Имя/i), { target: { value: "Ирина" } });
    fireEvent.change(screen.getByLabelText(/Фамилия/i), { target: { value: "Соколова" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "irina@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Отправить приглашение" }));

    await waitFor(() => {
      expect(createModeratorInvitation).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Ирина",
          surname: "Соколова",
          email: "irina@example.com",
        })
      );
    });
  });
});
