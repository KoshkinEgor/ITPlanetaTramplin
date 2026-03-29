import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpportunityBlockRail } from "./OpportunityBlockRail";

const items = [
  {
    id: "security",
    typeKey: "vacancy",
    typeTone: "blue",
    type: "Vacancy",
    status: "Open",
    statusTone: "success",
    title: "Junior Security Analyst",
    meta: "Acme Security • Moscow + remote",
    primaryFactLabel: "Salary",
    primaryFactValue: "from 90 000 ₽",
    secondaryFact: "Remote",
    tertiaryFact: "Moscow",
    chips: ["Junior", "SOC", "SIEM"],
  },
  {
    id: "design",
    typeKey: "internship",
    typeTone: "green",
    type: "Internship",
    status: "Soon",
    statusTone: "warning",
    title: "Mobile UI/UX",
    meta: "White Tiger Soft • remote",
    primaryFactLabel: "Payment",
    primaryFactValue: "Paid",
    secondaryFact: "Duration: 8 weeks",
    tertiaryFact: "Hybrid",
    chips: ["Design", "Paid"],
  },
  {
    id: "event",
    typeKey: "event",
    typeTone: "orange",
    type: "Event",
    status: "Open",
    statusTone: "success",
    title: "IT Planet",
    meta: "IT Planet • online",
    primaryFactLabel: "Date",
    primaryFactValue: "18 April",
    secondaryFact: "Registration until 10 April",
    tertiaryFact: "Online",
    chips: ["Students", "Community"],
  },
];

describe("OpportunityBlockRail", () => {
  it("renders a horizontal rail of block cards with typed facts and full-width detail actions", () => {
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
    expect(within(rail).getByText("Salary")).toBeInTheDocument();
    expect(within(rail).getByText("from 90 000 ₽")).toBeInTheDocument();
    expect(within(rail).getByText("Remote")).toBeInTheDocument();
  });
});
