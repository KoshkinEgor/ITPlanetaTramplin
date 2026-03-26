import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ModerationDecisionSelect } from "./ModerationDecisionSelect";

const options = [
  { value: "approved", label: "Одобрить", tone: "approve", confirmationButtonLabel: "Одобрить" },
  { value: "revision", label: "Отправить на доработку", tone: "revision", confirmationButtonLabel: "Отправить на доработку" },
  { value: "rejected", label: "Отклонить", tone: "reject", confirmationButtonLabel: "Отклонить" },
];

function TestHarness({ onConfirm }) {
  const [value, setValue] = useState("approved");

  return (
    <ModerationDecisionSelect
      value={value}
      options={options}
      onConfirm={async (nextValue, option, payload) => {
        await onConfirm(nextValue, option, payload);
        setValue(nextValue);
      }}
      getDialogProps={(option) => ({
        actionLabel: option.value === "revision" ? "Отправить публикацию на доработку" : option.label,
        question: "Вы уверены?",
        description: "Действие будет применено к выбранной публикации.",
        reasonLabel: option.value === "revision" ? "Причина отказа" : undefined,
        reasonPlaceholder: option.value === "revision" ? "Опишите, что нужно исправить" : undefined,
      })}
    />
  );
}

describe("ModerationDecisionSelect", () => {
  it("does not render a reason field for approval when the dialog config does not request it", () => {
    render(<TestHarness onConfirm={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Одобрить" }));
    fireEvent.click(screen.getByRole("option", { name: "Одобрить" }));

    const dialog = screen.getByRole("dialog");

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Причина отказа")).not.toBeInTheDocument();
  });

  it("opens the moderation dialog and forwards the selected value with the revision reason", async () => {
    const handleConfirm = vi.fn().mockResolvedValue(undefined);

    render(<TestHarness onConfirm={handleConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Одобрить" }));
    fireEvent.click(screen.getByRole("option", { name: "Отправить на доработку" }));

    const dialog = screen.getByRole("dialog");

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Отправить публикацию на доработку")).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText("Причина отказа"), { target: { value: "Нужно уточнить формат публикации" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Отправить на доработку" }));

    await waitFor(() => {
      expect(handleConfirm).toHaveBeenCalledWith(
        "revision",
        expect.objectContaining({ value: "revision" }),
        {
          variant: "revision",
          reason: "Нужно уточнить формат публикации",
        }
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
