import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OpportunityBlockSlider } from "./OpportunityBlockSlider";

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

describe("OpportunityBlockSlider", () => {
  it("renders a uniform rail of medium block cards", () => {
    render(
      <OpportunityBlockSlider
        ariaLabel="Opportunity slider"
        items={items}
        cardPropsBuilder={(item) => ({
          detailAction: { href: `#${item.id}`, label: "More", variant: "secondary" },
        })}
      />
    );

    const rail = screen.getByRole("region", { name: "Opportunity slider" });

    expect(rail.querySelectorAll(".opportunity-block-slider__item")).toHaveLength(3);
    expect(rail.querySelectorAll(".ui-opportunity-card--md")).toHaveLength(3);
  });

  it("promotes the card nearest to the left edge in the leading-featured variant", async () => {
    const requestAnimationFrameSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });

    const cancelAnimationFrameSpy = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    render(
      <OpportunityBlockSlider
        ariaLabel="Featured opportunity slider"
        items={items}
        variant="leading-featured"
        cardPropsBuilder={(item) => ({
          detailAction: { href: `#${item.id}`, label: "More", variant: "secondary" },
        })}
      />
    );

    const rail = screen.getByRole("region", { name: "Featured opportunity slider" });
    const sliderItems = Array.from(rail.querySelectorAll(".opportunity-block-slider__item"));

    sliderItems.forEach((item, index) => {
      Object.defineProperty(item, "offsetLeft", {
        configurable: true,
        value: index * 420,
      });
    });

    Object.defineProperty(rail, "scrollLeft", {
      configurable: true,
      writable: true,
      value: 390,
    });

    fireEvent.scroll(rail);

    await waitFor(() => {
      expect(sliderItems[1]).toHaveClass("is-active");
      expect(sliderItems[1].querySelector(".ui-opportunity-card--lg")).not.toBeNull();
    });

    requestAnimationFrameSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
  });
});
