import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "../Checkbox/Checkbox";
import { ChoiceGroup } from "./ChoiceGroup";

describe("ChoiceGroup", () => {
  it("applies the shared medium font weight and full width classes", () => {
    render(
      <ChoiceGroup as="div" legend="Contact preferences" fontWeight="medium" width="full">
        <Checkbox checked onChange={() => {}} label="Email contact" />
      </ChoiceGroup>
    );

    const group = screen.getByRole("group", { name: "Contact preferences" });

    expect(group).toHaveClass("ui-font-weight-medium");
    expect(group).toHaveClass("ui-width-full");
  });
});
