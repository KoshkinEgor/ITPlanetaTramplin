import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OpportunityBlockSlider } from "./OpportunityBlockSlider";

const items = [
  {
    id: "security",
    type: "Vacancy",
    status: "Open",
    statusTone: "success",
    title: "Junior Security Analyst",
    meta: "Acme Security В· Moscow + remote",
    accent: "from 90 000 в‚Ѕ",
    chips: ["Junior", "SOC", "SIEM"],
  },
  {
    id: "design",
    type: "Internship",
    status: "Soon",
    statusTone: "warning",
    title: "Mobile UI/UX",
    meta: "White Tiger Soft В· remote",
    accent: "starts in April",
    chips: ["Design", "Paid"],
  },
  {
    id: "event",
    type: "Event",
    status: "Open",
    statusTone: "success",
    title: "IT Planet",
    meta: "IT Planet В· online",
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
    const [firstAction] = within(rail).getAllByRole("link", { name: "More" });

    expect(rail.querySelectorAll(".opportunity-block-slider__item")).toHaveLength(3);
    expect(rail.querySelectorAll(".ui-opportunity-card--md")).toHaveLength(3);
    expect(firstAction).toHaveClass("ui-width-full");
  });

  it("renders custom slide content through renderItem", () => {
    render(
      <OpportunityBlockSlider
        ariaLabel="Custom opportunity slider"
        items={items}
        renderItem={(item, index, { className }) => (
          <article className={className} data-testid={`custom-slide-${index}`}>
            <h3>{item.title}</h3>
          </article>
        )}
      />
    );

    const rail = screen.getByRole("region", { name: "Custom opportunity slider" });

    expect(rail.querySelectorAll(".opportunity-block-slider__item")).toHaveLength(3);
    expect(screen.getByTestId("custom-slide-0")).toHaveClass("opportunity-block-slider__card");
    expect(within(rail).getByText("Junior Security Analyst")).toBeInTheDocument();
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

  it("renders arrow controls and advances the active card in the raised-featured variant", async () => {
    render(
      <OpportunityBlockSlider
        ariaLabel="Raised featured opportunity slider"
        items={items}
        variant="raised-featured"
        cardPropsBuilder={(item) => ({
          detailAction: { href: `#${item.id}`, label: "More", variant: "secondary" },
        })}
      />
    );

    const rail = screen.getByRole("region", { name: "Raised featured opportunity slider" });
    const sliderItems = Array.from(rail.querySelectorAll(".opportunity-block-slider__item"));

    sliderItems.forEach((item, index) => {
      Object.defineProperty(item, "offsetLeft", {
        configurable: true,
        value: index * 420,
      });
    });

    rail.scrollTo = vi.fn();

    fireEvent.click(screen.getByRole("button", { name: "Next card" }));

    await waitFor(() => {
      expect(sliderItems[1]).toHaveClass("is-active");
      expect(rail.scrollTo).toHaveBeenCalledWith({ left: 420, behavior: "smooth" });
    });
  });
});
