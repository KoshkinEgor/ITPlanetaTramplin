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
      name: "Анна",
      surname: "Иванова",
      skills: ["UX", "Figma", "Research"],
      links: {
        onboarding: {
          profession: "UX/UI дизайнер",
          city: "Чебоксары",
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
          name: "Александра Морева",
          email: "alex@example.com",
          skills: ["UX", "Figma", "Web-design"],
        },
      ],
      recommendations: [
        {
          id: "internship-1",
          opportunityType: "internship",
          title: "Веб-дизайнер",
          companyName: "White Tiger Soft",
          duration: "Длительность: 8 недель",
          tags: ["Студенты", "Без опыта"],
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

    const careerTitle = screen.getByRole("heading", { name: "Карьера" });
    const topPanel = screen.getByRole("heading", { name: "Твоя карьера" });
    const coursesSection = screen.getByRole("heading", { name: "Курсы по навыкам" });
    const opportunitiesSection = screen.getByRole("heading", { name: "Пройди стажировку и совершенствуй свои навыки" });
    const mentorsSection = screen.getByRole("heading", { name: "Есть вопросы? Обратись к нашим менторам!" });
    const peersSection = screen.getByRole("heading", { name: "У вас есть общие интересы" });

    expect(topPanel).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Твои навыки" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Уровень зарплат в Чебоксары" })).toBeInTheDocument();
    expect(screen.getByText("Нейросети для дизайна")).toBeInTheDocument();
    expect(screen.getByText("Веб-дизайнер")).toBeInTheDocument();
    expect(screen.getByText("Мария Соколова")).toBeInTheDocument();
    expect(screen.getByText("Александра Морева")).toBeInTheDocument();

    expect(isBefore(careerTitle, coursesSection)).toBe(true);
    expect(isBefore(coursesSection, opportunitiesSection)).toBe(true);
    expect(isBefore(opportunitiesSection, mentorsSection)).toBe(true);
    expect(isBefore(mentorsSection, peersSection)).toBe(true);
  });
});
