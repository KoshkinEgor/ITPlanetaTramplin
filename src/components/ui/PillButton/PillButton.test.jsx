import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PillButton } from "./PillButton";

describe("PillButton", () => {
  it("supports the large size variant and active state", () => {
    render(
      <PillButton size="lg" active>
        Все
      </PillButton>
    );

    const button = screen.getByRole("button", { name: "Все" });

    expect(button).toHaveClass("ui-pill-button--lg");
    expect(button).toHaveClass("is-active");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("fires click handlers like a regular shared control", () => {
    const onClick = vi.fn();

    render(<PillButton onClick={onClick}>Вакансии</PillButton>);
    fireEvent.click(screen.getByRole("button", { name: "Вакансии" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
