import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompanyVacancyTile } from "./CompanyVacancyTile";

describe("CompanyVacancyTile", () => {
  it("renders name, count, and auto-generated initials", () => {
    render(<CompanyVacancyTile name="IGrids Team" count="20 вакансий" tone="lime" />);

    const tile = screen.getByText("IGrids Team").closest(".ui-company-vacancy-tile");

    expect(tile).toHaveClass("ui-company-vacancy-tile--lime");
    expect(screen.getByText("20 вакансий")).toBeInTheDocument();
    expect(screen.getByText("IT")).toBeInTheDocument();
  });

  it("uses explicit initials when they are provided", () => {
    render(<CompanyVacancyTile name="КейсСистемс" count="32 вакансии" initials="KS" tone="neutral" />);

    expect(screen.getByText("KS")).toBeInTheDocument();
    expect(screen.getByText("КейсСистемс").closest(".ui-company-vacancy-tile")).toHaveClass("ui-company-vacancy-tile--neutral");
  });
});
