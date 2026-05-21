import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { decideComplaintModeration, getModerationComplaints } from "../api/moderation";
import { ModeratorComplaintsApp } from "./ModeratorComplaintsApp";

vi.mock("../api/moderation", () => ({
  getModerationComplaints: vi.fn(),
  decideComplaintModeration: vi.fn(),
}));

const complaintItems = [
  {
    id: "junior-security-analyst",
    opportunityTitle: "Junior Security Analyst",
    companyName: "Secure Lab",
    reason: "Недостоверная зарплата",
    description: "Зарплатная вилка отличается от описания.",
    createdAt: "2026-03-19",
    count: 6,
    status: "pending",
  },
  {
    id: "signal-hub-duplicate",
    opportunityTitle: "Signal Hub HR",
    companyName: "Signal Hub",
    reason: "Дублирующиеся сообщения кандидатам",
    createdAt: "2026-03-18",
    count: 5,
    status: "pending",
  },
  {
    id: "orbit-lab-contacts",
    opportunityTitle: "Orbit Lab",
    companyName: "Orbit Lab",
    reason: "Сбор личных контактов",
    createdAt: "2026-03-20",
    count: 2,
    status: "pending",
  },
];

describe("ModeratorComplaintsApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getModerationComplaints.mockResolvedValue(complaintItems);
    decideComplaintModeration.mockResolvedValue({});
  });

  it("renders the complaint queue sorted by count by default", async () => {
    render(<ModeratorComplaintsApp />);

    expect(screen.getByRole("heading", { name: "Работа с жалобами" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Очередь жалоб" })).toBeInTheDocument();
    expect(await screen.findByText("Отсортировано 3 карточек жалоб.")).toBeInTheDocument();

    const cards = screen.getAllByRole("heading", { level: 3 });
    expect(cards[0]).toHaveTextContent("Junior Security Analyst");
    expect(cards[1]).toHaveTextContent("Signal Hub HR");
    expect(screen.getByTestId("moderator-complaint-card-junior-security-analyst")).toHaveClass("ui-complaint-card");
  });

  it("switches sorting to date order and sends selected complaint action", async () => {
    render(<ModeratorComplaintsApp />);

    await screen.findByText("Отсортировано 3 карточек жалоб.");

    fireEvent.click(screen.getByRole("button", { name: "По дате" }));

    const queue = screen.getByRole("region", { name: "Очередь жалоб" });
    const headings = within(queue).getAllByRole("heading", { level: 3 });
    expect(headings[0]).toHaveTextContent("Orbit Lab");
    expect(headings[2]).toHaveTextContent("Signal Hub HR");

    const firstCard = screen.getByTestId("moderator-complaint-card-orbit-lab-contacts");
    fireEvent.click(within(firstCard).getByRole("button", { name: "Открыть список действий" }));
    fireEvent.click(screen.getByRole("option", { name: "Передать на проверку" }));
    fireEvent.click(screen.getByRole("button", { name: "Передать" }));

    await waitFor(() => {
      expect(decideComplaintModeration).toHaveBeenCalledWith("orbit-lab-contacts", { status: "review" });
    });
  });
});
