import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TagSelector } from "./TagSelector";

describe("TagSelector", () => {
  it("applies the shared medium font weight and full width classes on the root shell", () => {
    render(
      <TagSelector
        title="Skills"
        value={["React"]}
        suggestions={["React", "Vue"]}
        fontWeight="medium"
        width="full"
      />
    );

    const shell = screen.getByText("React").closest(".ui-tag-selector");

    expect(shell).toHaveClass("ui-font-weight-medium");
    expect(shell).toHaveClass("ui-width-full");
  });
});
