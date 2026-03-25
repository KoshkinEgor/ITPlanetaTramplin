import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActionSelect } from "./ActionSelect";

const options = [
  { value: "block", label: "Заблокировать" },
  { value: "delete", label: "Удалить", tone: "danger" },
];

describe("ActionSelect", () => {
  it("switches to the selected danger action in uncontrolled mode", () => {
    render(<ActionSelect defaultValue="block" options={options} />);

    fireEvent.click(screen.getByRole("button", { name: "Заблокировать" }));
    fireEvent.click(screen.getByRole("option", { name: "Удалить" }));

    expect(screen.getByRole("button", { name: "Удалить" })).toHaveClass("ui-action-select--danger");
  });

  it("calls onValueChange in controlled mode", () => {
    const handleValueChange = vi.fn();

    render(<ActionSelect value="block" onValueChange={handleValueChange} options={options} />);

    fireEvent.click(screen.getByRole("button", { name: "Заблокировать" }));
    fireEvent.click(screen.getByRole("option", { name: "Удалить" }));

    expect(handleValueChange).toHaveBeenCalledWith("delete");
    expect(screen.getByRole("button", { name: "Заблокировать" })).not.toHaveClass("ui-action-select--danger");
  });
});
