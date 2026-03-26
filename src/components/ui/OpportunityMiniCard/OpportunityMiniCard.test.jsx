import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OpportunityMiniCard } from "./OpportunityMiniCard";

const item = {
  type: "Р’Р°РєР°РЅСЃРёСЏ",
  status: "РџРѕРґС…РѕРґРёС‚ РЅР° 85%",
  statusTone: "success",
  title: "Junior Security Analyst",
  company: "РћРћРћ РљРѕРјРїР°РЅРёСЏ В· РњРѕСЃРєРІР° В· РѕРЅР»Р°Р№РЅ",
  accentPrefix: "РѕС‚",
  accent: "90 000 в‚Ѕ",
  chips: ["Junior", "SOC", "SIEM"],
};

describe("OpportunityMiniCard", () => {
  it("renders the featured card by default", () => {
    render(<OpportunityMiniCard item={item} detailAction={{ href: "#details", label: "РџРѕРґСЂРѕР±РЅРµРµ", variant: "secondary" }} />);

    const card = screen.getByText("Junior Security Analyst").closest(".ui-opportunity-mini-card");
    const action = screen.getByRole("link", { name: "РџРѕРґСЂРѕР±РЅРµРµ" });

    expect(card).not.toHaveClass("ui-opportunity-mini-card--compact");
    expect(action).toHaveClass("ui-button--lg");
    expect(action).toHaveClass("ui-width-full");
  });

  it("supports the compact variant for rail cards", () => {
    render(<OpportunityMiniCard item={item} variant="compact" detailAction={{ href: "#details", label: "РџРѕРґСЂРѕР±РЅРµРµ", variant: "secondary" }} />);

    const card = screen.getByText("Junior Security Analyst").closest(".ui-opportunity-mini-card");
    const favoriteButton = screen.getByRole("button", { name: "Сохранить возможность" });

    expect(card).toHaveClass("ui-opportunity-mini-card--compact");
    expect(favoriteButton).toHaveClass("ui-icon-button--xl");
    expect(screen.getByRole("link", { name: "РџРѕРґСЂРѕР±РЅРµРµ" })).not.toHaveClass("ui-button--lg");
  });

  it("supports an optional dismiss action in the top-right corner", () => {
    const onDismiss = vi.fn();

    render(
      <OpportunityMiniCard
        item={item}
        variant="compact"
        dismissAction={{ label: "Р—Р°РєСЂС‹С‚СЊ РєР°СЂС‚РѕС‡РєСѓ", onClick: onDismiss }}
        detailAction={{ href: "#details", label: "Р СџР С•Р Т‘РЎР‚Р С•Р В±Р Р…Р ВµР Вµ", variant: "secondary" }}
      />
    );

    const dismissButton = screen.getByRole("button", { name: "Р—Р°РєСЂС‹С‚СЊ РєР°СЂС‚РѕС‡РєСѓ" });

    expect(screen.queryByRole("button", { name: "Р РЋР С•РЎвЂ¦РЎР‚Р В°Р Р…Р С‘РЎвЂљРЎРЉ Р Р†Р С•Р В·Р СР С•Р В¶Р Р…Р С•РЎРѓРЎвЂљРЎРЉ" })).not.toBeInTheDocument();

    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
