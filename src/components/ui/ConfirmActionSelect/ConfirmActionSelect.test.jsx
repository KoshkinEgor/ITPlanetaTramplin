import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmActionSelect } from "./ConfirmActionSelect";

const options = [
  { value: "approved", label: "Одобрить", tone: "approve" },
  { value: "revision", label: "Отправить на доработку", tone: "revision" },
  { value: "rejected", label: "Отклонить", tone: "reject", confirmationButtonVariant: "danger" },
];

function TestHarness({ onConfirm }) {
  const [value, setValue] = useState("approved");

  return (
    <ConfirmActionSelect
      value={value}
      options={options}
      onConfirm={async (nextValue) => {
        await onConfirm(nextValue);
        setValue(nextValue);
      }}
      getConfirmation={(option) => ({
        title: `${option.label} публикацию?`,
        description: "Действие будет применено к выбранной публикации.",
        confirmLabel: option.label,
      })}
    />
  );
}

describe("ConfirmActionSelect", () => {
  it("opens confirmation and applies the selected action", async () => {
    const handleConfirm = vi.fn().mockResolvedValue(undefined);

    render(<TestHarness onConfirm={handleConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Одобрить" }));
    fireEvent.click(screen.getByRole("option", { name: "Отклонить" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Отклонить публикацию?" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Отклонить" }));

    await waitFor(() => {
      expect(handleConfirm).toHaveBeenCalledWith("rejected");
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Отклонить" })).toHaveClass("ui-action-select--reject");
  });

  it("supports split mode where the main button confirms the current action", async () => {
    const handleConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <ConfirmActionSelect
        split
        value="approved"
        options={options}
        onConfirm={handleConfirm}
        getConfirmation={(option) => ({
          title: `${option.label} публикацию?`,
          description: "Действие будет применено к выбранной публикации.",
          confirmLabel: option.label,
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Одобрить" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Одобрить публикацию?" })).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Одобрить" }));

    await waitFor(() => {
      expect(handleConfirm).toHaveBeenCalledWith("approved", expect.objectContaining({ value: "approved" }));
    });
  });
});
