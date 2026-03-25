import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { SearchInput } from "./SearchInput";

function ControlledSearchInput() {
  const [value, setValue] = useState("Поиск возможностей");

  return <SearchInput value={value} onValueChange={setValue} clearLabel="Очистить поиск" />;
}

describe("SearchInput", () => {
  it("clears the current value via the icon button and keeps focus on the field", () => {
    render(<ControlledSearchInput />);

    const input = screen.getByRole("searchbox");
    const clearButton = screen.getByRole("button", { name: "Очистить поиск" });

    input.focus();
    fireEvent.mouseDown(clearButton);
    fireEvent.click(clearButton);

    expect(input).toHaveValue("");
    expect(document.activeElement).toBe(input);
  });

  it("does not render the clear action when the field is disabled", () => {
    render(<SearchInput value="Поиск возможностей" clearLabel="Очистить поиск" disabled />);

    expect(screen.queryByRole("button", { name: "Очистить поиск" })).not.toBeInTheDocument();
  });

  it("applies elevated appearance and lg size classes on the shared shell", () => {
    render(<SearchInput value="" appearance="elevated" size="lg" placeholder="Search" />);

    const shell = screen.getByRole("searchbox").closest(".ui-search-input");

    expect(shell).toHaveClass("ui-search-input--elevated");
    expect(shell).toHaveClass("ui-search-input--lg");
  });
});
