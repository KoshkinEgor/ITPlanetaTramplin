import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { CandidateCareerDashboard } from "./CandidateCareerDashboard";

function isBefore(firstNode, secondNode) {
  return Boolean(firstNode.compareDocumentPosition(secondNode) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe("CandidateCareerDashboard", () => {
  it("renders the extracted career sections in the expected order with typed opportunity facts", () => {
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
          userId: 1,
          name: "Александра Морева",
          email: "alex@example.com",
          city: "Чебоксары",
          skills: ["UX", "Figma", "Web-design"],
          relationship: {
            contactState: "saved",
            friendState: "none",
            projectInviteState: "none",
          },
        },
      ],
      suggestions: [
        {
          userId: 2,
          name: "Мария Ильина",
          email: "maria@example.com",
          city: "Чебоксары",
          skills: ["Research", "UX"],
          reasons: ["Общие навыки: UX, Research"],
          relationship: {
            contactState: "none",
            friendState: "none",
            projectInviteState: "none",
          },
        },
      ],
      recommendations: [
        {
          id: "internship-1",
          opportunityType: "internship",
          title: "Веб-дизайнер",
          companyName: "White Tiger Soft",
          locationCity: "Чебоксары",
          employmentType: "hybrid",
          isPaid: false,
          duration: "8 недель",
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
    const networkSection = screen.getByRole("heading", { name: "Активные связи" });
    const suggestionsSection = screen.getByRole("heading", { name: "Люди под ваши отклики" });

    expect(topPanel).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Твои навыки" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Уровень зарплат в Чебоксары" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Career courses slider" }).querySelectorAll(".opportunity-block-slider__item")).toHaveLength(6);
    expect(screen.getByRole("region", { name: "Career opportunities slider" }).querySelectorAll(".opportunity-block-slider__item")).toHaveLength(1);
    expect(screen.getByText("Нейросети для дизайна")).toBeInTheDocument();
    expect(screen.getAllByText("Веб-дизайнер").length).toBeGreaterThan(0);
    expect(screen.getByText("Оплата")).toBeInTheDocument();
    expect(screen.getByText("Без оплаты")).toBeInTheDocument();
    expect(screen.getByText("Длительность: 8 недель")).toBeInTheDocument();
    expect(screen.getByText("Александра Морева")).toBeInTheDocument();
    expect(screen.getByText("Мария Ильина")).toBeInTheDocument();

    const firstCourseLink = screen.getAllByRole("link", { name: "Перейти к курсу" })[0];
    const opportunitiesSlider = screen.getByRole("region", { name: "Career opportunities slider" }).parentElement;

    expect(firstCourseLink).toHaveAttribute("href", "https://practicum.yandex.ru/ai-tools-for-designers/");
    expect(firstCourseLink).toHaveAttribute("target", "_blank");
    expect(firstCourseLink).toHaveAttribute("rel", "noreferrer");
    expect(opportunitiesSlider).not.toHaveClass("opportunity-block-slider--leading-featured");

    fireEvent.click(screen.getAllByRole("button", { name: "Профиль" })[0]);
    expect(screen.getByText("Менторы скоро появятся")).toBeInTheDocument();
    expect(screen.getByText(/Раздел с менторами в разработке/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Понятно" }));
    expect(screen.queryByText("Менторы скоро появятся")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Все менторы →" }));
    expect(screen.getByText("Менторы скоро появятся")).toBeInTheDocument();

    expect(isBefore(careerTitle, coursesSection)).toBe(true);
    expect(isBefore(coursesSection, opportunitiesSection)).toBe(true);
    expect(isBefore(opportunitiesSection, mentorsSection)).toBe(true);
    expect(isBefore(mentorsSection, networkSection)).toBe(true);
    expect(isBefore(networkSection, suggestionsSection)).toBe(true);
  });

  it("shows an honest empty state when there are no real shared contacts", () => {
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
      applications: [],
      contacts: [],
      suggestions: [],
      recommendations: [],
      opportunities: [],
      degraded: false,
      error: null,
    };

    render(
      <MemoryRouter>
        <CandidateCareerDashboard profile={profile} dashboardState={dashboardState} />
      </MemoryRouter>
    );

    expect(screen.getByText("Пока нет реальных рекомендаций")).toBeInTheDocument();
    expect(screen.queryByText("Александра Морева")).not.toBeInTheDocument();
    expect(screen.queryByText("Анастасия Соколова")).not.toBeInTheDocument();
    expect(screen.queryByText("Мария Ильина")).not.toBeInTheDocument();
  });
});
