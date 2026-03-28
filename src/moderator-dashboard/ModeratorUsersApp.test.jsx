import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  decideUserModeration,
  getModerationUser,
  getModerationUsers,
  updateModerationUser,
} from "../api/moderation";
import { ModeratorUsersApp } from "./ModeratorUsersApp";

vi.mock("../api/moderation", () => ({
  decideUserModeration: vi.fn(),
  getModerationUser: vi.fn(),
  getModerationUsers: vi.fn(),
  updateModerationUser: vi.fn(),
}));

const listItems = [
  {
    id: 1,
    email: "alina.petrova@tramplin.local",
    displayName: "Алина Петрова",
    preVerify: true,
    isVerified: true,
    createdAt: "2026-03-19T10:00:00.000Z",
    role: "candidate",
    moderationStatus: "pending",
  },
];

const detailItem = {
  userId: 1,
  id: 1,
  email: "alina.petrova@tramplin.local",
  name: "Алина",
  surname: "Петрова",
  thirdname: "",
  description: "Product designer",
  skills: ["Figma", "Research"],
  moderationStatus: "pending",
  links: {
    onboarding: {
      city: "Москва",
      phone: "+79991234567",
    },
    contacts: {
      telegram: "@alina",
      vk: "vk.com/alina",
      behance: "",
      portfolio: "https://portfolio.example",
    },
    preferences: {
      visibility: {
        profileVisibility: "employers-and-contacts",
      },
    },
  },
};

describe("ModeratorUsersApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getModerationUsers.mockResolvedValue(listItems);
    getModerationUser.mockResolvedValue(detailItem);
    updateModerationUser.mockResolvedValue(undefined);
    decideUserModeration.mockResolvedValue(undefined);
  });

  it("loads candidate details into the modal and saves edits", async () => {
    render(<ModeratorUsersApp />);

    fireEvent.click(await screen.findByRole("button", { name: /Алина Петрова/i }));

    expect(await screen.findByLabelText(/Имя/i)).toHaveValue("Алина");

    fireEvent.change(screen.getByLabelText(/Имя/i), { target: { value: "Алина Сергеевна" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить анкету" }));

    await waitFor(() => {
      expect(updateModerationUser).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: "Алина Сергеевна",
          surname: "Петрова",
          skills: ["Figma", "Research"],
        })
      );
    });
  });

  it("updates the candidate moderation status explicitly", async () => {
    render(<ModeratorUsersApp />);

    fireEvent.click(await screen.findByRole("button", { name: /Алина Петрова/i }));

    expect(await screen.findByLabelText("Статус проверки")).toHaveValue("pending");

    fireEvent.change(screen.getByLabelText("Статус проверки"), { target: { value: "approved" } });
    fireEvent.click(screen.getByRole("button", { name: "Обновить статус" }));

    await waitFor(() => {
      expect(decideUserModeration).toHaveBeenCalledWith(1, "approved");
    });
  });
});
