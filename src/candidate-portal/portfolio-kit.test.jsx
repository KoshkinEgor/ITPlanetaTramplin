import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CandidateResumeMiniCard } from "./portfolio-kit";

describe("CandidateResumeMiniCard", () => {
  it("renders resume summary content with private visibility by default", () => {
    render(
      <CandidateResumeMiniCard
        title="Веб-дизайнер"
        updatedAt="2026-03-12"
        city="Чебоксары"
        experience="Опыт: не указан"
        stats={{ impressions: 0, views: 0, invitations: 0 }}
      />
    );

    expect(screen.getByRole("heading", { name: "Веб-дизайнер" })).toBeInTheDocument();
    expect(screen.getByText("Последнее редактирование: 12.03.2026")).toBeInTheDocument();
    expect(screen.getByText("Статистика за неделю")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Не видно никому" })).toHaveClass("is-active");
    expect(screen.getByRole("button", { name: "Видно работодателям" })).not.toHaveClass("is-active");
  });

  it("supports visibility switching and menu actions", () => {
    const onVisibilityChange = vi.fn();
    const onEditClick = vi.fn();
    const onDeleteClick = vi.fn();

    render(
      <CandidateResumeMiniCard
        title="UX/UI дизайнер"
        visibility="employers"
        onVisibilityChange={onVisibilityChange}
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Не видно никому" }));
    fireEvent.click(screen.getByRole("button", { name: "Открыть действия с резюме" }));

    expect(screen.getByRole("button", { name: "Видно работодателям" })).toHaveClass("is-active");
    expect(onVisibilityChange).toHaveBeenCalledWith("private");

    fireEvent.click(screen.getByRole("menuitem", { name: "Редактировать" }));
    fireEvent.click(screen.getByRole("button", { name: "Открыть действия с резюме" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Удалить" }));

    expect(onEditClick).toHaveBeenCalledTimes(1);
    expect(onDeleteClick).toHaveBeenCalledTimes(1);
  });

  it("supports read-only interactive mode without edit controls", () => {
    const onClick = vi.fn();

    render(
      <CandidateResumeMiniCard
        title="Публичное резюме"
        updatedAt="2026-03-12"
        city="Москва"
        experience="Опыт: 1 год"
        readOnly
        interactive
        onClick={onClick}
        interactionLabel="Открыть публичное резюме"
      />
    );

    expect(screen.queryByText("Видимость резюме")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Открыть публичное резюме" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Открыть публичное резюме" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
