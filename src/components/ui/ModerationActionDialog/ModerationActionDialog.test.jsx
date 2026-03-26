import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModerationActionDialog } from "./ModerationActionDialog";

describe("ModerationActionDialog", () => {
  it("renders the revision variant with a reason field and forwards the reason on confirm", () => {
    const handleConfirm = vi.fn();

    render(
      <ModerationActionDialog
        variant="revision"
        actionLabel="Отправить заявку на доработку"
        question="Вы уверены?"
        description="Заявка будет отправлена на доработку."
        reasonLabel="Причина отказа"
        defaultReasonValue="Не указан формат мероприятия"
        onConfirm={handleConfirm}
      />
    );

    expect(screen.getByText("Отправить заявку на доработку")).toBeInTheDocument();
    expect(screen.getByLabelText("Причина отказа")).toHaveValue("Не указан формат мероприятия");

    fireEvent.click(screen.getByRole("button", { name: "Отправить на доработку" }));

    expect(handleConfirm).toHaveBeenCalledWith({
      variant: "revision",
      reason: "Не указан формат мероприятия",
    });
  });

  it("resets the reason field and blocks confirmation when the reason is required", () => {
    render(
      <ModerationActionDialog
        variant="revision"
        reasonLabel="Причина отказа"
        defaultReasonValue="Нужен комментарий"
        reasonRequired
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Сбросить" }));

    expect(screen.getByLabelText("Причина отказа")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Отправить на доработку" })).toBeDisabled();
  });
});
