import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OpportunityMiniCard } from "./OpportunityMiniCard";

const item = {
  type: "Р вЂ™Р В°Р С”Р В°Р Р…РЎРѓР С‘РЎРЏ",
  status: "Р СџР С•Р Т‘РЎвЂ¦Р С•Р Т‘Р С‘РЎвЂљ Р Р…Р В° 85%",
  statusTone: "success",
  title: "Junior Security Analyst",
  company: "Р С›Р С›Р С› Р С™Р С•Р СР С—Р В°Р Р…Р С‘РЎРЏ Р’В· Р СљР С•РЎРѓР С”Р Р†Р В° Р’В· Р С•Р Р…Р В»Р В°Р в„–Р Р…",
  accentPrefix: "Р С•РЎвЂљ",
  accent: "90 000 РІвЂљР…",
  chips: ["Junior", "SOC", "SIEM"],
};

describe("OpportunityMiniCard", () => {
  it("renders the featured card by default", () => {
    render(<OpportunityMiniCard item={item} detailAction={{ href: "#details", label: "Р СџР С•Р Т‘РЎР‚Р С•Р В±Р Р…Р ВµР Вµ", variant: "secondary" }} />);

    const card = screen.getByText("Junior Security Analyst").closest(".ui-opportunity-mini-card");
    const action = screen.getByRole("link", { name: "Р СџР С•Р Т‘РЎР‚Р С•Р В±Р Р…Р ВµР Вµ" });

    expect(card).not.toHaveClass("ui-opportunity-mini-card--compact");
    expect(action).toHaveClass("ui-button--lg");
    expect(action).toHaveClass("ui-width-full");
  });

  it("supports the compact variant for rail cards", () => {
    render(<OpportunityMiniCard item={item} variant="compact" detailAction={{ href: "#details", label: "Р СџР С•Р Т‘РЎР‚Р С•Р В±Р Р…Р ВµР Вµ", variant: "secondary" }} />);

    const card = screen.getByText("Junior Security Analyst").closest(".ui-opportunity-mini-card");
    const favoriteButton = screen.getByRole("button", { name: "Сохранить возможность" });

    expect(card).toHaveClass("ui-opportunity-mini-card--compact");
    expect(favoriteButton).toHaveClass("ui-icon-button--xl");
    expect(screen.getByRole("link", { name: "Р СџР С•Р Т‘РЎР‚Р С•Р В±Р Р…Р ВµР Вµ" })).not.toHaveClass("ui-button--lg");
  });

  it("supports the map-compact variant for anchored map previews", () => {
    render(<OpportunityMiniCard item={item} variant="map-compact" detailAction={{ href: "#details", label: "Р СџР С•Р Т‘РЎР‚Р С•Р В±Р Р…Р ВµР Вµ", variant: "secondary" }} />);

    const card = screen.getByText("Junior Security Analyst").closest(".ui-opportunity-mini-card");
    const favoriteButton = screen.getByRole("button", { name: "Сохранить возможность" });
    const action = screen.getByRole("link", { name: "Р СџР С•Р Т‘РЎР‚Р С•Р В±Р Р…Р ВµР Вµ" });

    expect(card).toHaveClass("ui-opportunity-mini-card--compact");
    expect(card).toHaveClass("ui-opportunity-mini-card--map-compact");
    expect(favoriteButton).toHaveClass("ui-icon-button--lg");
    expect(action).toHaveClass("ui-button--sm");
    expect(screen.getByText("Junior")).toBeInTheDocument();
    expect(screen.getByText("SOC")).toBeInTheDocument();
    expect(screen.queryByText("SIEM")).not.toBeInTheDocument();
  });

  it("supports an optional dismiss action in the top-right corner", () => {
    const onDismiss = vi.fn();

    render(
      <OpportunityMiniCard
        item={item}
        variant="compact"
        dismissAction={{ label: "Р вЂ”Р В°Р С”РЎР‚РЎвЂ№РЎвЂљРЎРЉ Р С”Р В°РЎР‚РЎвЂљР С•РЎвЂЎР С”РЎС“", onClick: onDismiss }}
        detailAction={{ href: "#details", label: "Р СџР С•Р Т‘РЎР‚Р С•Р В±Р Р…Р ВµР Вµ", variant: "secondary" }}
      />
    );

    const dismissButton = screen.getByRole("button", { name: "Р вЂ”Р В°Р С”РЎР‚РЎвЂ№РЎвЂљРЎРЉ Р С”Р В°РЎР‚РЎвЂљР С•РЎвЂЎР С”РЎС“" });

    expect(screen.queryByRole("button", { name: "Р В Р Р‹Р В РЎвЂўР РЋРІР‚В¦Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р В РЎвЂР РЋРІР‚С™Р РЋР Р‰ Р В Р вЂ Р В РЎвЂўР В Р’В·Р В РЎВР В РЎвЂўР В Р’В¶Р В Р вЂ¦Р В РЎвЂўР РЋР С“Р РЋРІР‚С™Р РЋР Р‰" })).not.toBeInTheDocument();

    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
