import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EducationListEditor } from "./EducationListEditor";

function createItem(overrides = {}) {
  return {
    draftKey: overrides.draftKey ?? "education-1",
    institutionName: overrides.institutionName ?? "ЧГУ им. И. Н. Ульянова",
    faculty: overrides.faculty ?? "",
    specialization: overrides.specialization ?? "",
    graduationYear: overrides.graduationYear ?? "2027",
  };
}

describe("EducationListEditor", () => {
  it("renders several education cards and exposes add/remove actions", () => {
    const onAddItem = vi.fn();
    const onRemoveItem = vi.fn();

    render(
      <EducationListEditor
        items={[createItem(), createItem({ draftKey: "education-2", institutionName: "МГТУ" })]}
        onAddItem={onAddItem}
        onRemoveItem={onRemoveItem}
      />
    );

    expect(screen.getByDisplayValue("ЧГУ им. И. Н. Ульянова")).toBeInTheDocument();
    expect(screen.getByDisplayValue("МГТУ")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Добавить еще образование" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Удалить" })[0]);

    expect(onAddItem).toHaveBeenCalledTimes(1);
    expect(onRemoveItem).toHaveBeenCalledTimes(1);
  });

  it("forwards field changes with the draft key and normalized year", () => {
    const onItemChange = vi.fn();

    render(
      <EducationListEditor
        items={[createItem({ institutionName: "" })]}
        onItemChange={onItemChange}
        errorsByKey={{ "education-1": { institutionName: "Укажите учебное заведение." } }}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("ЧГУ им. И. Н. Ульянова"), { target: { value: "КФУ" } });
    fireEvent.change(screen.getByPlaceholderText("2027"), { target: { value: "20ab27" } });

    expect(onItemChange).toHaveBeenCalledWith("education-1", "institutionName", "КФУ");
    expect(onItemChange).toHaveBeenCalledWith("education-1", "graduationYear", "2027");
    expect(screen.getByText("Укажите учебное заведение.")).toBeInTheDocument();
  });
});
