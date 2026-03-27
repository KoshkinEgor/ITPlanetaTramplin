import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpportunityBlockRail } from "./OpportunityBlockRail";

const items = [
  {
    id: "security",
    type: "Vacancy",
    status: "Open",
    statusTone: "success",
    title: "Junior Security Analyst",
    meta: "Acme Security · Moscow + remote",
    accent: "from 90 000 ₽",
    chips: ["Junior", "SOC", "SIEM"],
  },
  {
    id: "design",
    type: "Internship",
    status: "Soon",
    statusTone: "warning",
    title: "Mobile UI/UX",
    meta: "White Tiger Soft · remote",
    accent: "starts in April",
    chips: ["Design", "Paid"],
  },
  {
    id: "event",
    type: "Event",
    status: "Open",
    statusTone: "success",
    title: "IT Planet",
    meta: "IT Planet · online",
    accent: "155 registrations",
    chips: ["Students", "Community"],
  },
];

describe("OpportunityBlockRail", () => {
  it("renders a horizontal rail of block cards with full-width detail actions", () => {
    render(
      <OpportunityBlockRail
        ariaLabel="Recommended opportunities"
        items={items}
        cardPropsBuilder={(item) => ({
          detailAction: { href: `#${item.id}`, label: "More", variant: "secondary" },
        })}
      />
    );

    const rail = screen.getByRole("region", { name: "Recommended opportunities" });
    const actions = within(rail).getAllByRole("link", { name: "More" });

    expect(rail.querySelectorAll(".opportunity-block-rail__item")).toHaveLength(3);
    expect(rail.querySelectorAll(".ui-opportunity-card--md")).toHaveLength(3);
    expect(actions[0]).toHaveClass("ui-width-full");
  });
});
