import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ModeratorComplaintsApp } from "./ModeratorComplaintsApp";

describe("ModeratorComplaintsApp", () => {
  it("renders the complaint queue sorted by count by default", () => {
    render(<ModeratorComplaintsApp />);

    expect(screen.getByRole("heading", { name: "Работа с жалобами" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Очередь жалоб" })).toBeInTheDocument();
    expect(screen.getByText("Отсортировано 7 карточек жалоб.")).toBeInTheDocument();

    const cards = screen.getAllByRole("heading", { level: 3 });
    expect(cards[0]).toHaveTextContent("Junior Security Analyst");
    expect(cards[1]).toHaveTextContent("Signal Hub HR");
    expect(screen.getByTestId("moderator-complaint-card-junior-security-analyst")).toHaveClass("ui-complaint-card");
  });

  it("switches sorting to date order and keeps complaint actions interactive", () => {
    render(<ModeratorComplaintsApp />);

    fireEvent.click(screen.getByRole("button", { name: "По дате" }));

    const queue = screen.getByRole("region", { name: "Очередь жалоб" });
    const headings = within(queue).getAllByRole("heading", { level: 3 });
    expect(headings[0]).toHaveTextContent("Junior Security Analyst");
    expect(headings[2]).toHaveTextContent("Signal Hub HR");

    const firstCard = screen.getByTestId("moderator-complaint-card-junior-security-analyst");
    fireEvent.click(within(firstCard).getByRole("button", { name: "Открыть список действий" }));
    fireEvent.click(screen.getByRole("option", { name: "Передать на проверку" }));
    fireEvent.click(screen.getByRole("button", { name: "Передать" }));

    expect(within(firstCard).getByRole("button", { name: "Передать на проверку" })).toBeInTheDocument();
  });
});
