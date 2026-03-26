import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { decideOpportunityModeration, getModerationOpportunities } from "../api/moderation";
import { ModeratorOpportunitiesApp } from "./ModeratorOpportunitiesApp";

vi.mock("../api/moderation", () => ({
  decideOpportunityModeration: vi.fn(),
  getModerationOpportunities: vi.fn(),
}));

describe("ModeratorOpportunitiesApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    decideOpportunityModeration.mockResolvedValue(undefined);
  });

  it("shows the detailed review card only after selecting a publication block", async () => {
    getModerationOpportunities.mockResolvedValue([
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
      {
        id: 102,
        title: "Frontend Internship",
        companyName: "Contoso",
        opportunityType: "internship",
        moderationStatus: "revision",
        publishAt: "2026-03-20T10:00:00.000Z",
        expireAt: "2026-04-20T10:00:00.000Z",
        locationCity: "Kazan",
        locationAddress: "Office",
        description: "Build and refine UI components.",
      },
    ]);

    const { container } = render(<ModeratorOpportunitiesApp />);

    await screen.findAllByText("Security Analyst");
    const [publicationButton] = container.querySelectorAll(".moderator-table__row");

    expect(container.querySelector(".moderator-detail-card")).not.toBeInTheDocument();
    expect(container.querySelector(".moderator-review-grid--with-detail")).not.toBeInTheDocument();

    fireEvent.click(publicationButton);

    expect(container.querySelector(".moderator-detail-card")).toBeInTheDocument();
    expect(container.querySelector(".moderator-review-grid--with-detail")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Security Analyst" })).toBeInTheDocument();

    fireEvent.click(publicationButton);

    expect(container.querySelector(".moderator-detail-card")).not.toBeInTheDocument();
    expect(container.querySelector(".moderator-review-grid--with-detail")).not.toBeInTheDocument();
  });
});
