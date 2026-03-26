import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ComplaintCard } from "./ComplaintCard";

const actionOptions = [
  { value: "block", label: "Заблокировать", tone: "reject" },
  { value: "review", label: "Передать на проверку", tone: "revision" },
  { value: "dismiss", label: "Снять жалобу", tone: "approve" },
];

describe("ComplaintCard", () => {
  it("renders complaint details and count badge", () => {
    render(
      <ComplaintCard
        title="Junior Security Analyst"
        meta={["Недостоверная зарплата", "19 марта 2026"]}
        description="Жалобы объединены по одной вакансии."
        count={6}
        actionOptions={actionOptions}
      />
    );

    expect(screen.getByText("Жалоба")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Junior Security Analyst" })).toBeInTheDocument();
    expect(screen.getByText("Недостоверная зарплата")).toBeInTheDocument();
    expect(screen.getByText("19 марта 2026")).toBeInTheDocument();
    expect(screen.getByText("Жалобы объединены по одной вакансии.")).toBeInTheDocument();
    expect(screen.getByLabelText("Количество жалоб: 6")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Заблокировать" })).toBeInTheDocument();
  });

  it("supports a compact md size variant", () => {
    render(
      <ComplaintCard
        size="md"
        title="Signal Hub HR"
        meta={["Спам в откликах", "18 марта 2026"]}
        description="Жалобы связаны с массовыми откликами."
        count={4}
        actionOptions={actionOptions}
      />
    );

    const card = screen.getByRole("article");
    expect(card).toHaveClass("ui-complaint-card--md");
    expect(screen.getByRole("heading", { name: "Signal Hub HR" })).toHaveClass("ui-type-h3");
  });

  it("opens confirmation on main action button click", () => {
    render(
      <ComplaintCard
        title="Junior Security Analyst"
        meta={["Недостоверная зарплата", "19 марта 2026"]}
        description="Жалобы объединены по одной вакансии."
        count={6}
        actionOptions={actionOptions}
        actionValue="block"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Заблокировать" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Вы уверены?" })).toBeInTheDocument();
    expect(screen.getByText("Действие «Заблокировать» будет применено к жалобе «Junior Security Analyst».")).toBeInTheDocument();
  });

  it("forwards action changes from the dropdown after confirmation", () => {
    const handleActionChange = vi.fn();

    render(
      <ComplaintCard
        title="Signal Hub HR"
        meta={["Спам в откликах", "18 марта 2026"]}
        description="Жалобы связаны с массовыми откликами."
        count={4}
        actionOptions={actionOptions}
        actionValue="block"
        onActionChange={handleActionChange}
      />
    );

    const card = screen.getByRole("article");

    fireEvent.click(within(card).getByRole("button", { name: "Открыть список действий" }));
    fireEvent.click(screen.getByRole("option", { name: "Передать на проверку" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Передать на проверку" }));

    expect(handleActionChange).toHaveBeenCalledWith("review", expect.objectContaining({ value: "review" }));
  });
});
