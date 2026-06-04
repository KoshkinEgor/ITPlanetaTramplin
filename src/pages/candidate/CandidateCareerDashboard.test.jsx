import { render, screen } from "@testing-library/react";
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
    const opportunitiesSection = screen.getByRole("heading", { name: "Рекомендованные возможности" });
    const coursesSection = screen.getByRole("heading", { name: "Рекомендованные курсы" });
    const networkSection = screen.getByRole("heading", { name: "Активные связи" });
    const suggestionsSection = screen.getByRole("heading", { name: "Люди под ваши отклики" });

    expect(topPanel).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Воспользуйся моментом" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Откликнуться" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Твои навыки" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Уровень зарплат в Чебоксары" })).toBeInTheDocument();
    
    // The unified "Все" tab slider should contain only 1 opportunity item
    expect(screen.getByRole("region", { name: "all recommendations slider" }).querySelectorAll(".opportunity-block-slider__item")).toHaveLength(1);
    
    // The standalone courses slider should contain 6 course items
    expect(screen.getByRole("region", { name: "Career courses slider" }).querySelectorAll(".opportunity-block-slider__item")).toHaveLength(6);
    
    expect(screen.getAllByText("Нейросети для дизайна").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Веб-дизайнер").length).toBeGreaterThan(0);
    expect(screen.getByText("Оплата")).toBeInTheDocument();
    expect(screen.getAllByText("Без оплаты").length).toBeGreaterThan(0);
    expect(screen.getByText("Длительность: 8 недель")).toBeInTheDocument();
    expect(screen.getByText("Александра Морева")).toBeInTheDocument();
    expect(screen.getByText("Мария Ильина")).toBeInTheDocument();

    const firstCourseLink = screen.getAllByRole("link", { name: "Перейти к курсу" })[0];
    const opportunitiesSlider = screen.getByRole("region", { name: "all recommendations slider" }).parentElement;

    expect(firstCourseLink).toHaveAttribute("href", "https://practicum.yandex.ru/ai-tools-for-designers/");
    expect(firstCourseLink).toHaveAttribute("target", "_blank");
    expect(firstCourseLink).toHaveAttribute("rel", "noreferrer");
    expect(opportunitiesSlider).not.toHaveClass("opportunity-block-slider--leading-featured");

    expect(screen.getAllByRole("link", { name: "Подробнее" })[0]).toBeInTheDocument();
    expect(screen.queryByText("Менторы скоро появятся")).not.toBeInTheDocument();

    expect(isBefore(careerTitle, opportunitiesSection)).toBe(true);
    expect(isBefore(opportunitiesSection, coursesSection)).toBe(true);
    expect(isBefore(coursesSection, networkSection)).toBe(true);
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
    expect(screen.getByRole("heading", { name: "Воспользуйся моментом" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Откликнуться" })).toBeInTheDocument();
    expect(screen.getByText("Дизайнер интерфейсов Мобильных приложений UI/UX")).toBeInTheDocument();
    expect(screen.queryByText("Александра Морева")).not.toBeInTheDocument();
    expect(screen.queryByText("Анастасия Соколова")).not.toBeInTheDocument();
    expect(screen.queryByText("Мария Ильина")).not.toBeInTheDocument();
  });

  it("hides the CTA block if the match percentage is below 70%", () => {
    const profile = {
      name: "Иван",
      surname: "Петров",
      skills: ["C#", "SQL", "ASP.NET"],
      links: {
        onboarding: {
          profession: "Бэкенд разработчик",
          city: "Москва",
        },
      },
    };

    const dashboardState = {
      status: "ready",
      applications: [],
      contacts: [],
      suggestions: [],
      recommendations: [
        {
          id: "design-internship",
          opportunityType: "internship",
          title: "UX/UI Дизайнер",
          companyName: "Design Agency",
          locationCity: "Москва",
          employmentType: "onsite",
          isPaid: true,
          stipendFrom: 20000,
          stipendTo: 30000,
          duration: "4 недели",
          tags: ["Figma", "Sketch", "Prototyping"],
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

    expect(screen.queryByRole("heading", { name: "Воспользуйся моментом" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Откликнуться" })).not.toBeInTheDocument();
  });

  it("renders AI Mode switcher, status, generate card when no cache is present", () => {
    const profile = {
      name: "Анна",
      surname: "Иванова",
      skills: ["UX"],
    };

    const dashboardState = {
      status: "ready",
      applications: [],
      contacts: [],
      suggestions: [],
      recommendations: [],
      opportunities: [],
      aiRecommendations: {
        refreshReason: "no_cache",
        isFallback: true,
      },
      aiStatus: "idle",
      aiError: null,
    };

    render(
      <MemoryRouter>
        <CandidateCareerDashboard
          profile={profile}
          dashboardState={dashboardState}
          mode="ai"
          onModeChange={() => {}}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Карьерный маршрут" })).toBeInTheDocument();
    expect(screen.getByText("ИИ-разбор не сформирован")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Персональный ИИ-разбор карьеры" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сформировать разбор" })).toBeInTheDocument();
  });

  it("renders AI panels and AI sub-sections when cache is present", () => {
    const profile = {
      name: "Анна",
      surname: "Иванова",
      skills: ["UX"],
    };

    const dashboardState = {
      status: "ready",
      applications: [],
      contacts: [],
      suggestions: [],
      recommendations: [
        {
          id: 1,
          opportunityType: "vacancy",
          title: "Frontend developer",
          companyName: "Tech Corp",
          locationCity: "Москва",
          tags: ["React"],
          moderationStatus: "approved",
        }
      ],
      opportunities: [],
      aiRecommendations: {
        refreshReason: "profile_or_applications_changed",
        isFallback: false,
        summary: "Вы отлично подходите для frontend ролей.",
        nextActions: ["Изучить React", "Сделать проект"],
        profileAssessment: {
          score: 85,
          summary: "Хороший профиль.",
          strengths: ["Опыт с JS"],
          improvements: ["Добавить TypeScript"],
        },
        portfolioAssessment: {
          score: 70,
          summary: "Портфолио в порядке.",
          strengths: ["Есть пет-проекты"],
          improvements: ["Описать архитектуру"],
        },
        salaryInsight: {
          currentLevel: "Junior",
          nextLevel: "Middle",
          summary: "Зарплата соответствует.",
          ranges: [{ label: "Москва", range: "80-120к" }],
        },
        skillGaps: [
          { skill: "TypeScript", reason: "Часто используется", priority: "high" },
        ],
        careerPlan: [
          { day: "День 1", action: "Учить TS", outcome: "Базовые знания" }
        ],
        eventInsight: {
          status: "invited",
          opportunityTitle: "Frontend разработчик в Яндекс",
          insight: "Вы приглашены на собеседование.",
          recommendedActions: ["Подготовить рассказ о проектах"]
        },
        items: [
          {
            opportunityId: 1,
            matchPercent: 90,
            reason: "Подходит по React",
            matchedSkills: ["React"],
            missingSkills: [],
            nextStep: "Откликнуться"
          }
        ]
      },
      aiStatus: "ready",
      aiError: null,
    };

    render(
      <MemoryRouter>
        <CandidateCareerDashboard
          profile={profile}
          dashboardState={dashboardState}
          mode="ai"
        />
      </MemoryRouter>
    );

    expect(screen.getByText("ИИ-разбор актуален")).toBeInTheDocument();
    expect(screen.getByText("Вы отлично подходите для frontend ролей.")).toBeInTheDocument();
    
    // Obsolete blocks should not be present
    expect(screen.queryByRole("heading", { name: "Оценка портфолио (AI)" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Разрыв навыков (AI)" })).not.toBeInTheDocument();
    
    // Employer view block should be present
    expect(screen.getByRole("heading", { name: "Профиль глазами работодателя" })).toBeInTheDocument();
    expect(screen.getByText("Понятно, кто вы")).toBeInTheDocument();
    expect(screen.getByText("Есть подтверждение навыков")).toBeInTheDocument();
    expect(screen.getByText("Показаны проекты")).toBeInTheDocument();
    expect(screen.getByText("Есть карьерная цель")).toBeInTheDocument();
    
    expect(screen.getByRole("link", { name: "Создать проект" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Создать резюме" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Личный кабинет" })).toBeInTheDocument();
    
    expect(screen.getByRole("heading", { name: "Что изменилось после отклика (AI)" })).toBeInTheDocument();
    expect(screen.getByText("Frontend разработчик в Яндекс")).toBeInTheDocument();
    expect(screen.getByText("Получено приглашение")).toBeInTheDocument();
    
    expect(screen.getByText("Мини-план на 7 дней")).toBeInTheDocument();
    expect(screen.getByText("Учить TS")).toBeInTheDocument();
  });
});
