import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OpportunityMiniCard } from "./OpportunityMiniCard";

const vacancyItem = {
  id: 1,
  opportunityType: "vacancy",
  moderationStatus: "approved",
  title: "Junior Security Analyst",
  companyName: "Shield Ops",
  locationCity: "Москва",
  employmentType: "remote",
  salaryFrom: 90000,
  salaryTo: 120000,
  tags: ["Junior", "SOC", "SIEM"],
};

const internshipItem = {
  id: 2,
  opportunityType: "internship",
  moderationStatus: "approved",
  title: "Frontend internship",
  companyName: "Northwind",
  locationCity: "Москва",
  employmentType: "hybrid",
  isPaid: false,
  duration: "8 недель",
  tags: ["Frontend", "React", "TypeScript"],
};

const mentoringItem = {
  id: 3,
  opportunityType: "mentoring",
  moderationStatus: "approved",
  title: "Product mentor",
  companyName: "Northwind",
  locationCity: "Казань",
  duration: "2 месяца",
  meetingFrequency: "еженедельно",
  seatsCount: 4,
  tags: ["Mentoring", "Product", "Community"],
};

describe("OpportunityMiniCard", () => {
  it("renders vacancy facts in the featured variant", () => {
    render(
      <OpportunityMiniCard
        item={vacancyItem}
        detailAction={{ href: "#details", label: "Подробнее", variant: "secondary" }}
      />
    );

    const card = screen.getByText("Junior Security Analyst").closest(".ui-opportunity-mini-card");
    const action = screen.getByRole("link", { name: "Подробнее" });

    expect(card).not.toHaveClass("ui-opportunity-mini-card--compact");
    expect(card).toHaveAttribute("data-opportunity-type-tone", "blue");
    expect(screen.getByText("Зарплата")).toBeInTheDocument();
    expect(screen.getByText(/90/)).toBeInTheDocument();
    expect(screen.getByText("Формат: Удаленно")).toBeInTheDocument();
    expect(action).toHaveClass("ui-button--lg");
    expect(action).toHaveClass("ui-width-full");
  });

  it("renders internship facts in the compact variant", () => {
    render(
      <OpportunityMiniCard
        item={internshipItem}
        variant="compact"
        detailAction={{ href: "#details", label: "Подробнее", variant: "secondary" }}
      />
    );

    const card = screen.getByText("Frontend internship").closest(".ui-opportunity-mini-card");
    const favoriteButton = screen.getByRole("button", { name: "Сохранить возможность" });

    expect(card).toHaveClass("ui-opportunity-mini-card--compact");
    expect(card).toHaveAttribute("data-opportunity-type-tone", "green");
    expect(screen.getByText("Оплата")).toBeInTheDocument();
    expect(screen.getByText("Без оплаты")).toBeInTheDocument();
    expect(screen.getByText("Длительность: 8 недель")).toBeInTheDocument();
    expect(favoriteButton).toHaveClass("ui-icon-button--xl");
    expect(screen.getByRole("link", { name: "Подробнее" })).not.toHaveClass("ui-button--lg");
  });

  it("renders mentoring facts in the map-compact variant and trims chips", () => {
    render(
      <OpportunityMiniCard
        item={mentoringItem}
        variant="map-compact"
        detailAction={{ href: "#details", label: "Подробнее", variant: "secondary" }}
      />
    );

    const card = screen.getByText("Product mentor").closest(".ui-opportunity-mini-card");
    const favoriteButton = screen.getByRole("button", { name: "Сохранить возможность" });
    const action = screen.getByRole("link", { name: "Подробнее" });

    expect(card).toHaveClass("ui-opportunity-mini-card--compact");
    expect(card).toHaveClass("ui-opportunity-mini-card--map-compact");
    expect(card).toHaveAttribute("data-opportunity-type-tone", "teal");
    expect(screen.getByText("Длительность")).toBeInTheDocument();
    expect(screen.getByText("2 месяца")).toBeInTheDocument();
    expect(screen.getByText("Встречи: еженедельно")).toBeInTheDocument();
    expect(favoriteButton).toHaveClass("ui-icon-button--lg");
    expect(action).toHaveClass("ui-button--sm");
    expect(screen.getByText("Mentoring")).toBeInTheDocument();
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.queryByText("Community")).not.toBeInTheDocument();
  });

  it("supports an optional dismiss action in the top-right corner", () => {
    const onDismiss = vi.fn();

    render(
      <OpportunityMiniCard
        item={vacancyItem}
        variant="compact"
        dismissAction={{ label: "Удалить карточку", onClick: onDismiss }}
        detailAction={{ href: "#details", label: "Подробнее", variant: "secondary" }}
      />
    );

    const dismissButton = screen.getByRole("button", { name: "Удалить карточку" });

    expect(screen.queryByRole("button", { name: "Сохранить возможность" })).not.toBeInTheDocument();

    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
