import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getModerationUsers } from "../api/moderation";
import { ModeratorUsersApp } from "./ModeratorUsersApp";

vi.mock("../api/moderation", () => ({
  getModerationUsers: vi.fn(),
}));

describe("ModeratorUsersApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the display name as the primary label in the table and detail card", async () => {
    getModerationUsers.mockResolvedValue([
      {
        id: 1,
        email: "alina.petrova.with.long.address@tramplin-platform.example",
        displayName: "Алина Петрова",
        preVerify: true,
        isVerified: true,
        createdAt: "2026-03-19T10:00:00.000Z",
        role: "candidate",
      },
    ]);

    render(<ModeratorUsersApp />);

    const names = await screen.findAllByText("Алина Петрова");
    expect(names).toHaveLength(2);
    expect(screen.getByRole("heading", { level: 3, name: "Алина Петрова" })).toBeInTheDocument();
    expect(screen.getAllByText("alina.petrova.with.long.address@tramplin-platform.example")).toHaveLength(2);
    expect(screen.getByText("Имя")).toBeInTheDocument();
  });
});
