import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpportunityMiniCard } from "./OpportunityMiniCard";

const item = {
  type: "Вакансия",
  status: "Подходит на 85%",
  statusTone: "success",
  title: "Junior Security Analyst",
  company: "ООО Компания · Москва · онлайн",
  accentPrefix: "от",
  accent: "90 000 ₽",
  chips: ["Junior", "SOC", "SIEM"],
};

describe("OpportunityMiniCard", () => {
  it("renders the featured card by default", () => {
    render(<OpportunityMiniCard item={item} detailAction={{ href: "#details", label: "Подробнее", variant: "secondary" }} />);

    const card = screen.getByText("Junior Security Analyst").closest(".ui-opportunity-mini-card");
    expect(card).not.toHaveClass("ui-opportunity-mini-card--compact");
    expect(screen.getByRole("link", { name: "Подробнее" })).toHaveClass("ui-button--lg");
  });

  it("supports the compact variant for rail cards", () => {
    render(<OpportunityMiniCard item={item} variant="compact" detailAction={{ href: "#details", label: "Подробнее", variant: "secondary" }} />);

    const card = screen.getByText("Junior Security Analyst").closest(".ui-opportunity-mini-card");
    const favoriteButton = screen.getByRole("button", { name: "Сохранить возможность" });

    expect(card).toHaveClass("ui-opportunity-mini-card--compact");
    expect(favoriteButton).toHaveClass("ui-icon-button--xl");
    expect(screen.getByRole("link", { name: "Подробнее" })).not.toHaveClass("ui-button--lg");
  });
});
