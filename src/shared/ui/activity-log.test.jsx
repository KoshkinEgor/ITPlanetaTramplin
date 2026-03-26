import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActivityLog } from "./index";

const filters = [
  { value: "all", label: "Все" },
  { value: "approved", label: "Подтверждены" },
];

const items = [
  {
    id: "signal-hub",
    kind: "Возможность",
    title: "Создана вакансия Signal Hub",
    description: "Компания отправила стажировку на проверку.",
    timestamp: "19 марта · 11:20",
    timestampValue: "2026-03-19T11:20:00",
  },
];

describe("shared activity log", () => {
  it("renders search, filters, and entries from shared/ui", () => {
    const onSearchChange = vi.fn();
    const onFilterChange = vi.fn();

    render(
      <ActivityLog
        label="Журнал"
        title="Последние записи"
        description="Описание журнала"
        searchValue=""
        onSearchChange={onSearchChange}
        searchPlaceholder="Поиск по действиям"
        filters={filters}
        activeFilter="all"
        onFilterChange={onFilterChange}
        items={items}
      />
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Поиск по действиям" }), { target: { value: "Signal" } });
    fireEvent.click(screen.getByRole("button", { name: "Подтверждены" }));

    expect(onSearchChange).toHaveBeenCalledWith("Signal");
    expect(onFilterChange).toHaveBeenCalledWith("approved");
    expect(screen.getByText("Создана вакансия Signal Hub")).toBeInTheDocument();
    expect(screen.getByText("19 марта · 11:20")).toBeInTheDocument();
  });
});
