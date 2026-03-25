import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContentRail } from "./ContentRail";

describe("ContentRail", () => {
  it("renders children in a horizontally scrollable region with configurable width and gap", () => {
    render(
      <ContentRail ariaLabel="Recommended opportunities" itemWidth="400px" gap="24px">
        <div>One</div>
        <div>Two</div>
      </ContentRail>
    );

    const rail = screen.getByRole("region", { name: "Recommended opportunities" });

    expect(rail).toHaveStyle("--ui-content-rail-item-width: 400px");
    expect(rail).toHaveStyle("--ui-content-rail-gap: 24px");
    expect(rail.querySelectorAll(".ui-content-rail__item")).toHaveLength(2);
  });
});
