import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { CandidateCareerDashboard } from "./CandidateCareerDashboard";

function isBefore(firstNode, secondNode) {
  return Boolean(firstNode.compareDocumentPosition(secondNode) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe("CandidateCareerDashboard", () => {
  it("renders the extracted career sections in the expected order", () => {
    const profile = {
      name: "\u0410\u043d\u043d\u0430",
      surname: "\u0418\u0432\u0430\u043d\u043e\u0432\u0430",
      skills: ["UX", "Figma", "Research"],
      links: {
        onboarding: {
          profession: "UX/UI \u0434\u0438\u0437\u0430\u0439\u043d\u0435\u0440",
          city: "\u0427\u0435\u0431\u043e\u043a\u0441\u0430\u0440\u044b",
        },
      },
    };

    const dashboardState = {
      status: "ready",
      applications: [
        { status: "submitted" },
        { status: "reviewing" },
        { status: "reviewing" },
        { status: "invited" },
      ],
      contacts: [
        {
          id: "peer-1",
          name: "\u0410\u043b\u0435\u043a\u0441\u0430\u043d\u0434\u0440\u0430 \u041c\u043e\u0440\u0435\u0432\u0430",
          email: "alex@example.com",
          skills: ["UX", "Figma", "Web-design"],
        },
      ],
      recommendations: [
        {
          id: "internship-1",
          opportunityType: "internship",
          title: "\u0412\u0435\u0431-\u0434\u0438\u0437\u0430\u0439\u043d\u0435\u0440",
          companyName: "White Tiger Soft",
          duration: "\u0414\u043b\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u044c: 8 \u043d\u0435\u0434\u0435\u043b\u044c",
          tags: ["\u0421\u0442\u0443\u0434\u0435\u043d\u0442\u044b", "\u0411\u0435\u0437 \u043e\u043f\u044b\u0442\u0430"],
          moderationStatus: "approved",
        },
      ],
      opportunities: [],
      degraded: false,
      error: null,
    };

    render(
      <MemoryRouter>
        <CandidateCareerDashboard profile={profile} dashboardState={dashboardState} />
      </MemoryRouter>
    );

    const careerTitle = screen.getByRole("heading", { name: "\u041a\u0430\u0440\u044c\u0435\u0440\u0430" });
    const topPanel = screen.getByRole("heading", { name: "\u0422\u0432\u043e\u044f \u043a\u0430\u0440\u044c\u0435\u0440\u0430" });
    const coursesSection = screen.getByRole("heading", { name: "\u041a\u0443\u0440\u0441\u044b \u043f\u043e \u043d\u0430\u0432\u044b\u043a\u0430\u043c" });
    const opportunitiesSection = screen.getByRole("heading", { name: "\u041f\u0440\u043e\u0439\u0434\u0438 \u0441\u0442\u0430\u0436\u0438\u0440\u043e\u0432\u043a\u0443 \u0438 \u0441\u043e\u0432\u0435\u0440\u0448\u0435\u043d\u0441\u0442\u0432\u0443\u0439 \u0441\u0432\u043e\u0438 \u043d\u0430\u0432\u044b\u043a\u0438" });
    const mentorsSection = screen.getByRole("heading", { name: "\u0415\u0441\u0442\u044c \u0432\u043e\u043f\u0440\u043e\u0441\u044b? \u041e\u0431\u0440\u0430\u0442\u0438\u0441\u044c \u043a \u043d\u0430\u0448\u0438\u043c \u043c\u0435\u043d\u0442\u043e\u0440\u0430\u043c!" });
    const peersSection = screen.getByRole("heading", { name: "\u0423 \u0432\u0430\u0441 \u0435\u0441\u0442\u044c \u043e\u0431\u0449\u0438\u0435 \u0438\u043d\u0442\u0435\u0440\u0435\u0441\u044b" });

    expect(topPanel).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "\u0422\u0432\u043e\u0438 \u043d\u0430\u0432\u044b\u043a\u0438" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "\u0423\u0440\u043e\u0432\u0435\u043d\u044c \u0437\u0430\u0440\u043f\u043b\u0430\u0442 \u0432 \u0427\u0435\u0431\u043e\u043a\u0441\u0430\u0440\u044b" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Career courses slider" }).querySelectorAll(".opportunity-block-slider__item")).toHaveLength(6);
    expect(screen.getByRole("region", { name: "Career opportunities slider" }).querySelectorAll(".opportunity-block-slider__item")).toHaveLength(4);
    expect(screen.getByText("\u041d\u0435\u0439\u0440\u043e\u0441\u0435\u0442\u0438 \u0434\u043b\u044f \u0434\u0438\u0437\u0430\u0439\u043d\u0430")).toBeInTheDocument();
    expect(screen.getAllByText("\u0412\u0435\u0431-\u0434\u0438\u0437\u0430\u0439\u043d\u0435\u0440").length).toBeGreaterThan(0);
    expect(screen.getByText("\u041c\u0430\u0440\u0438\u044f \u0421\u043e\u043a\u043e\u043b\u043e\u0432\u0430")).toBeInTheDocument();
    expect(screen.getByText("\u0410\u043b\u0435\u043a\u0441\u0430\u043d\u0434\u0440\u0430 \u041c\u043e\u0440\u0435\u0432\u0430")).toBeInTheDocument();

    expect(isBefore(careerTitle, coursesSection)).toBe(true);
    expect(isBefore(coursesSection, opportunitiesSection)).toBe(true);
    expect(isBefore(opportunitiesSection, mentorsSection)).toBe(true);
    expect(isBefore(mentorsSection, peersSection)).toBe(true);
  });
});
