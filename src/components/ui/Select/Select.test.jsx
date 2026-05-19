import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Select } from "./Select";

const options = [
  { value: "submitted", label: "Submitted" },
  { value: "reviewing", label: "Reviewing" },
];

describe("Select", () => {
  it("marks the shell as open while the menu is expanded", () => {
    const { container } = render(<Select defaultValue="submitted" options={options} />);

    const trigger = screen.getByRole("button", { name: "Submitted" });
    const shell = container.querySelector(".ui-select-shell");

    expect(shell).not.toHaveClass("is-open");

    fireEvent.click(trigger);

    expect(shell).toHaveClass("is-open");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });
});
