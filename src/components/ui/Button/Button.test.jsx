import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("applies the contrast variant and inline accent color variable", () => {
    render(
      <Button variant="contrast" accentColor="#3ddc72">
        Approve
      </Button>
    );

    const button = screen.getByRole("button", { name: "Approve" });

    expect(button).toHaveClass("ui-button--contrast");
    expect(button).toHaveStyle("--ui-button-accent: #3ddc72");
  });
});
