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

  it("supports the shared medium font weight and full width props", () => {
    render(
      <Button fontWeight="medium" width="full">
        Continue
      </Button>
    );

    const button = screen.getByRole("button", { name: "Continue" });

    expect(button).toHaveClass("ui-font-weight-medium");
    expect(button).toHaveClass("ui-width-full");
  });

  it("renders non-button elements without button-only attributes", () => {
    render(
      <Button as="span" disabled>
        Map CTA
      </Button>
    );

    const button = screen.getByText("Map CTA").closest(".ui-button");

    expect(button).not.toBeNull();
    expect(button.tagName).toBe("SPAN");
    expect(button).not.toHaveAttribute("type");
    expect(button).not.toHaveAttribute("disabled");
    expect(button).toHaveAttribute("aria-disabled", "true");
  });
});
