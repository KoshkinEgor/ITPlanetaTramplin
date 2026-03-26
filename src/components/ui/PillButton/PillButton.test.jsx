import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PillButton } from "./PillButton";

describe("PillButton", () => {
  it("supports the large size variant and active state", () => {
    render(
      <PillButton size="lg" active>
        Р’СЃРµ
      </PillButton>
    );

    const button = screen.getByRole("button", { name: "Р’СЃРµ" });

    expect(button).toHaveClass("ui-pill-button--lg");
    expect(button).toHaveClass("is-active");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("fires click handlers like a regular shared control", () => {
    const onClick = vi.fn();

    render(<PillButton onClick={onClick}>Р’Р°РєР°РЅСЃРёРё</PillButton>);
    fireEvent.click(screen.getByRole("button", { name: "Р’Р°РєР°РЅСЃРёРё" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies the shared medium font weight and full width classes", () => {
    render(
      <PillButton fontWeight="medium" width="full">
        РўРµРі
      </PillButton>
    );

    const button = screen.getByRole("button", { name: "РўРµРі" });

    expect(button).toHaveClass("ui-font-weight-medium");
    expect(button).toHaveClass("ui-width-full");
  });
});
