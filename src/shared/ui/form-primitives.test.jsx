import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Checkbox, FormField, Input, Radio, Select, Switch, Textarea } from "./index";

describe("shared form primitives", () => {
  it("renders Input inside FormField with helper wiring", () => {
    render(
      <FormField label="Email" hint="Helper text">
        <Input defaultValue="hello@tramplin.ru" />
      </FormField>
    );

    expect(screen.getByDisplayValue("hello@tramplin.ru")).toBeInTheDocument();
    expect(screen.getByText("Helper text")).toBeInTheDocument();
  });

  it("renders Textarea with a counter and updates its value", () => {
    render(<Textarea defaultValue="Short note" showCount maxLength={40} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Updated note" } });

    expect(textarea).toHaveValue("Updated note");
    expect(screen.getByText("12/40")).toBeInTheDocument();
  });

  it("renders Select and changes its value through the shared menu", () => {
    render(
      <Select
        defaultValue="design"
        options={[
          { value: "design", label: "Design" },
          { value: "frontend", label: "Frontend" },
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("option", { name: "Frontend" }));

    expect(screen.getByRole("button")).toHaveTextContent("Frontend");
  });

  it("renders Checkbox, Radio, and Switch with checked states", () => {
    render(
      <>
        <Checkbox checked onChange={() => {}} label="Accept rules" />
        <Radio checked onChange={() => {}} name="contact" label="Email contact" />
        <Switch checked onChange={() => {}} label="Public profile" />
      </>
    );

    expect(screen.getByLabelText("Accept rules")).toBeChecked();
    expect(screen.getByLabelText("Email contact")).toBeChecked();
    expect(screen.getByRole("switch", { name: "Public profile" })).toBeChecked();
  });

  it("applies shared font weight and full width props across form controls", () => {
    const { container } = render(
      <>
        <Input aria-label="Full input" defaultValue="hello@tramplin.ru" fontWeight="medium" width="full" />
        <Textarea aria-label="Full textarea" defaultValue="Short note" fontWeight="medium" width="full" />
        <Select
          defaultValue="design"
          width="full"
          fontWeight="medium"
          options={[
            { value: "design", label: "Design" },
            { value: "frontend", label: "Frontend" },
          ]}
        />
        <Checkbox checked onChange={() => {}} label="Full checkbox" fontWeight="medium" width="full" />
        <Radio checked onChange={() => {}} name="full-contact" label="Full radio" fontWeight="medium" width="full" />
        <Switch checked onChange={() => {}} label="Full switch" fontWeight="medium" width="full" />
      </>
    );

    expect(screen.getByLabelText("Full input")).toHaveClass("ui-font-weight-medium", "ui-width-full");
    expect(screen.getByLabelText("Full textarea")).toHaveClass("ui-font-weight-medium", "ui-width-full");
    expect(container.querySelector(".ui-select")).toHaveClass("ui-font-weight-medium", "ui-width-full");
    expect(screen.getByLabelText("Full checkbox").closest(".ui-check")).toHaveClass("ui-font-weight-medium", "ui-width-full");
    expect(screen.getByLabelText("Full radio").closest(".ui-check")).toHaveClass("ui-font-weight-medium", "ui-width-full");
    expect(screen.getByRole("switch", { name: "Full switch" }).closest(".ui-check")).toHaveClass("ui-font-weight-medium", "ui-width-full");
  });
});
