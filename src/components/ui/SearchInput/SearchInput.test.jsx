import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { SearchInput } from "./SearchInput";

function ControlledSearchInput() {
  const [value, setValue] = useState("РџРѕРёСЃРє РІРѕР·РјРѕР¶РЅРѕСЃС‚РµР№");

  return <SearchInput value={value} onValueChange={setValue} clearLabel="РћС‡РёСЃС‚РёС‚СЊ РїРѕРёСЃРє" />;
}

describe("SearchInput", () => {
  it("clears the current value via the icon button and keeps focus on the field", () => {
    render(<ControlledSearchInput />);

    const input = screen.getByRole("searchbox");
    const clearButton = screen.getByRole("button", { name: "РћС‡РёСЃС‚РёС‚СЊ РїРѕРёСЃРє" });

    input.focus();
    fireEvent.mouseDown(clearButton);
    fireEvent.click(clearButton);

    expect(input).toHaveValue("");
    expect(document.activeElement).toBe(input);
  });

  it("does not render the clear action when the field is disabled", () => {
    render(<SearchInput value="РџРѕРёСЃРє РІРѕР·РјРѕР¶РЅРѕСЃС‚РµР№" clearLabel="РћС‡РёСЃС‚РёС‚СЊ РїРѕРёСЃРє" disabled />);

    expect(screen.queryByRole("button", { name: "РћС‡РёСЃС‚РёС‚СЊ РїРѕРёСЃРє" })).not.toBeInTheDocument();
  });

  it("applies elevated appearance and lg size classes on the shared shell", () => {
    render(<SearchInput value="" appearance="elevated" size="lg" placeholder="Search" />);

    const shell = screen.getByRole("searchbox").closest(".ui-search-input");

    expect(shell).toHaveClass("ui-search-input--elevated");
    expect(shell).toHaveClass("ui-search-input--lg");
  });

  it("applies the shared medium font weight and full width classes on the shell", () => {
    render(<SearchInput value="" fontWeight="medium" width="full" placeholder="Search" />);

    const shell = screen.getByRole("searchbox").closest(".ui-search-input");

    expect(shell).toHaveClass("ui-font-weight-medium");
    expect(shell).toHaveClass("ui-width-full");
  });
});
