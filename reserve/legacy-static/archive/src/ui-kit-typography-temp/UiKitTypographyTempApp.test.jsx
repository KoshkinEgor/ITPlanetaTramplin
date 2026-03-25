import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UiKitTypographyTempApp } from "./UiKitTypographyTempApp";

describe("UiKitTypographyTempApp", () => {
  it("renders the isolated typography page and cleans up the body class", () => {
    const { unmount } = render(<UiKitTypographyTempApp />);

    expect(document.body).toHaveClass("ui-kit-typography-temp-body");
    expect(screen.getByTestId("ui-kit-typography-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Typography Playground" })).toBeInTheDocument();
    expect(screen.getByText("ui-kit-typo-type-h1")).toBeInTheDocument();

    unmount();

    expect(document.body).not.toHaveClass("ui-kit-typography-temp-body");
  });
});
