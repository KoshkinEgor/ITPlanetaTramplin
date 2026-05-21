import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AuthAccountMenu } from "./AuthAccountMenu";

vi.mock("./api", () => ({
  logoutCurrentAuthUser: vi.fn(() => Promise.resolve({})),
}));

function renderMenu(user) {
  return render(
    <MemoryRouter>
      <AuthAccountMenu user={user} />
    </MemoryRouter>
  );
}

describe("AuthAccountMenu", () => {
  it("shows the user avatar image when avatarUrl is available", () => {
    renderMenu({
      id: 1,
      role: "candidate",
      email: "anna@example.com",
      displayName: "Анна Иванова",
      avatarUrl: "https://cdn.example.com/avatar.png",
    });

    expect(screen.getByRole("img", { name: "Фото профиля Анна Иванова" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/avatar.png"
    );
  });

  it("falls back to initials when the avatar image fails to load", () => {
    renderMenu({
      id: 1,
      role: "candidate",
      email: "anna@example.com",
      displayName: "Анна Иванова",
      avatarUrl: "https://cdn.example.com/broken.png",
    });

    fireEvent.error(screen.getByRole("img", { name: "Фото профиля Анна Иванова" }));

    expect(screen.queryByRole("img", { name: "Фото профиля Анна Иванова" })).not.toBeInTheDocument();
    expect(screen.getByText("АИ")).toBeInTheDocument();
  });
});
