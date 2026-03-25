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
});
