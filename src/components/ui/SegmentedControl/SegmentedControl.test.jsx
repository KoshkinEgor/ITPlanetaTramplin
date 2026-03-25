import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./SegmentedControl";

const items = [
  { value: "resume", label: "Резюме" },
  { value: "portfolio", label: "Портфолио" },
];

describe("SegmentedControl", () => {
  it("switches the active item in uncontrolled mode", () => {
    render(<SegmentedControl items={items} defaultValue="portfolio" ariaLabel="Переключатель профиля" />);

    fireEvent.click(screen.getByRole("button", { name: "Резюме" }));

    expect(screen.getByRole("button", { name: "Резюме" })).toHaveClass("is-active");
    expect(screen.getByRole("button", { name: "Портфолио" })).not.toHaveClass("is-active");
  });

  it("calls onChange and respects the controlled value", () => {
    const handleChange = vi.fn();

    const { rerender } = render(
      <SegmentedControl items={items} value="resume" onChange={handleChange} ariaLabel="Переключатель профиля" />
    );

    fireEvent.click(screen.getByRole("button", { name: "Портфолио" }));

    expect(handleChange).toHaveBeenCalledWith("portfolio");
    expect(screen.getByRole("button", { name: "Резюме" })).toHaveClass("is-active");

    rerender(<SegmentedControl items={items} value="portfolio" onChange={handleChange} ariaLabel="Переключатель профиля" />);

    expect(screen.getByRole("button", { name: "Портфолио" })).toHaveClass("is-active");
  });
});
