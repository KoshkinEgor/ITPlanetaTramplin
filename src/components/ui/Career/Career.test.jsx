import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  CareerCourseCard,
  CareerMentorCard,
  CareerOpportunityCard,
  CareerPeerCard,
  CareerSalaryPanel,
  CareerSkillsPanel,
  CareerStatsPanel,
} from "./Career";

describe("Career UI assemblies", () => {
  it("renders the stats panel with highlighted success metric and CTA", () => {
    render(
      <CareerStatsPanel
        title="Твоя карьера"
        metaTitle="Анна Иванова"
        metaDescription="UX/UI дизайнер • Чебоксары"
        stats={[
          { value: "6", label: "Отклики" },
          { value: "2", label: "Рассмотрение" },
          { value: "1", label: "Приглашения", tone: "success" },
        ]}
        description="Подсказки по собеседованию помогут усилить профиль."
        cta={{ href: "#interview", label: "Подготовиться к собеседованию" }}
      />
    );

    expect(screen.getByText("Твоя карьера")).toBeInTheDocument();
    expect(screen.getByText("Анна Иванова")).toBeInTheDocument();
    expect(screen.getByText("Приглашения").closest(".ui-career-panel__stat")).toHaveClass("ui-career-panel__stat--success");
    expect(screen.getByRole("link", { name: "Подготовиться к собеседованию" })).toHaveClass("ui-width-full");
  });

  it("renders primary and recommended skill groups", () => {
    render(
      <CareerSkillsPanel
        title="Твои навыки"
        primarySkills={["SQL", "Python", "Research"]}
        suggestedSkills={["Вёрстка", "User interface"]}
        href="#courses"
      />
    );

    expect(screen.getByText("SQL")).toBeInTheDocument();
    expect(screen.getByText("Рекомендованные навыки")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Курсы по рекомендованным навыкам →" })).toHaveAttribute("href", "#courses");
  });

  it("renders the salary panel and highlights the last track", () => {
    render(
      <CareerSalaryPanel
        title="Уровень зарплат"
        city="Чебоксары"
        items={[
          { level: "Junior", range: "44-56 тыс. ₽", progress: 0.32 },
          { level: "Middle", range: "52-59 тыс. ₽", progress: 0.5 },
          { level: "Senior", range: "106-459 тыс. ₽", progress: 1 },
        ]}
      />
    );

    expect(screen.getByText("Уровень зарплат в Чебоксары")).toBeInTheDocument();
    expect(screen.getByText("Senior").closest(".ui-career-salary-panel__item")).toHaveClass("is-highlighted");
  });

  it("renders the course and opportunity cards with typed facts, actions and chips", () => {
    render(
      <>
        <CareerCourseCard
          meta="Продвинутый • 3 мес + онлайн"
          title="Нейросети для дизайна"
          provider="Яндекс Практикум"
          price="40 000 ₽"
          oldPrice="82 000 ₽"
          monthly="2325 ₽ в месяц"
          href="#course"
          actionTarget="_blank"
          actionRel="noreferrer"
        />
        <CareerOpportunityCard
          featured
          typeKey="internship"
          typeTone="green"
          type="Стажировка"
          status="Активно"
          statusTone="success"
          title="Веб-дизайнер"
          company="White Tiger Soft"
          primaryFactLabel="Оплата"
          primaryFactValue="Без оплаты"
          secondaryFact="Длительность: 8 недель"
          tertiaryFact="Формат: Гибрид"
          chips={["Студенты", "Без опыта"]}
          href="#opportunity"
        />
      </>
    );

    expect(screen.getByRole("link", { name: "Перейти к курсу" })).toHaveAttribute("href", "#course");
    expect(screen.getByRole("link", { name: "Перейти к курсу" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Перейти к курсу" })).toHaveAttribute("rel", "noreferrer");
    expect(screen.getByText("40 000 ₽")).toBeInTheDocument();

    const opportunityCard = screen.getByText("Веб-дизайнер").closest(".ui-career-opportunity-card");
    expect(opportunityCard).toHaveClass("ui-career-opportunity-card--featured");
    expect(opportunityCard).toHaveAttribute("data-opportunity-type-tone", "green");
    expect(screen.getByText("Оплата")).toBeInTheDocument();
    expect(screen.getByText("Без оплаты")).toBeInTheDocument();
    expect(screen.getByText("Длительность: 8 недель")).toBeInTheDocument();
    expect(screen.getByText("Формат: Гибрид")).toBeInTheDocument();
    expect(screen.getByText("Студенты")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сохранить возможность" })).toBeInTheDocument();
  });

  it("renders mentor avatar fallback and shared-skills peer card", () => {
    const handleMentorAction = vi.fn();

    render(
      <>
        <CareerMentorCard
          name="Мария Соколова"
          role="Карьерный консультант"
          summary="Сертифицированный карьерный консультант."
          onActionClick={handleMentorAction}
        />
        <CareerPeerCard
          name="Александра Морева"
          initials="АМ"
          sharedSkills={["Web-design", "UX", "Figma"]}
          profileHref="#peer-profile"
          href="#peer"
        />
      </>
    );

    expect(screen.getByText("МС")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Профиль" }));
    expect(handleMentorAction).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: /Александра Морева/ })).toHaveAttribute("href", "#peer-profile");
    expect(screen.getByText("3 общих навыка: Web-design, UX, Figma")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Добавить в контакты" })).toHaveAttribute("href", "#peer");
  });

  it("applies the requested typography utilities to the skills and salary panels", () => {
    const { container } = render(
      <>
        <CareerSkillsPanel title="Skills" description="Growth copy" primarySkills={["SQL"]} suggestedSkills={["HTML"]} />
        <CareerSalaryPanel title="Salary" city="Moscow" items={[{ level: "Junior", range: "44-56", progress: 0.32 }]} />
      </>
    );

    expect(screen.getByRole("heading", { name: "Skills" })).toHaveClass("ui-type-h2");
    expect(screen.getByText("Growth copy")).toHaveClass("ui-type-txt");
    expect(container.querySelector(".ui-career-panel__recommended")).toHaveClass("ui-type-txt-select");
    expect(container.querySelector(".ui-career-salary-panel__title")).toHaveClass("ui-type-h2");
    expect(screen.getByText("Junior")).toHaveClass("ui-type-txt-select");
    expect(screen.getByText("44-56")).toHaveClass("ui-type-h2");
  });
});
