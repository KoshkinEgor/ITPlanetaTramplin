import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  decideOpportunityModeration,
  getModerationOpportunities,
  getModerationOpportunity,
  updateModerationOpportunity,
} from "../api/moderation";
import { ModeratorOpportunitiesApp } from "./ModeratorOpportunitiesApp";

vi.mock("../api/moderation", () => ({
  decideOpportunityModeration: vi.fn(),
  getModerationOpportunities: vi.fn(),
  getModerationOpportunity: vi.fn(),
  updateModerationOpportunity: vi.fn(),
}));

const listItems = [
  {
    id: 101,
    title: "Security Analyst",
    companyName: "Northwind",
    opportunityType: "vacancy",
    moderationStatus: "pending",
    publishAt: "2026-03-19T10:00:00.000Z",
    expireAt: "2026-04-19T10:00:00.000Z",
    locationCity: "Moscow",
    locationAddress: "Remote",
    description: "Monitor incidents and review alerts.",
  },
];

const detailItem = {
  ...listItems[0],
  employmentType: "remote",
  latitude: 55.75,
  longitude: 37.61,
  contactsJson: JSON.stringify([{ type: "email", value: "team@northwind.example" }]),
  mediaContentJson: JSON.stringify([{ title: "Brochure", url: "https://northwind.example/brochure.pdf" }]),
  tags: ["Security", "SOC"],
};

async function openOpportunityModal() {
  const [tableRow] = await screen.findAllByRole("button", { name: /Security Analyst/i });
  fireEvent.click(tableRow);
}

describe("ModeratorOpportunitiesApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getModerationOpportunities.mockResolvedValue(listItems);
    getModerationOpportunity.mockResolvedValue(detailItem);
    updateModerationOpportunity.mockResolvedValue(undefined);
    decideOpportunityModeration.mockResolvedValue(undefined);
  });

  it("loads the detailed publication form and saves edits", async () => {
    render(<ModeratorOpportunitiesApp />);

    await openOpportunityModal();

    expect(await screen.findByLabelText(/Название/i)).toHaveValue("Security Analyst");

    fireEvent.change(screen.getByLabelText(/Название/i), { target: { value: "Security Analyst Updated" } });
    fireEvent.change(screen.getByLabelText(/Тип публикации/i), { target: { value: "mentoring" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить публикацию" }));

    await waitFor(() => {
      expect(updateModerationOpportunity).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          title: "Security Analyst Updated",
          opportunityType: "mentoring",
          tags: ["Security", "SOC"],
        })
      );
    });
  });

  it("opens a confirmation modal and sends the rejection comment", async () => {
    render(<ModeratorOpportunitiesApp />);

    await openOpportunityModal();

    expect(await screen.findByLabelText("Статус модерации")).toHaveValue("pending");

    fireEvent.change(screen.getByLabelText("Статус модерации"), { target: { value: "rejected" } });
    fireEvent.click(screen.getByRole("button", { name: "Применить решение" }));

    const confirmDialog = await screen.findByRole("dialog", { name: "Подтверждение решения по публикации" });

    fireEvent.change(within(confirmDialog).getByLabelText("Комментарий модератора"), {
      target: { value: "Публикацию нельзя разместить без уточнения условий." },
    });
    fireEvent.click(within(confirmDialog).getByRole("button", { name: "Отклонить" }));

    await waitFor(() => {
      expect(decideOpportunityModeration).toHaveBeenCalledWith(101, {
        status: "rejected",
        reason: "Публикацию нельзя разместить без уточнения условий.",
      });
    });
  });
});
