import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
        metaDescription="UX/UI дизайнер · Чебоксары"
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
        city="Чебоксарах"
        items={[
          { level: "Junior", range: "44-56 тыс. ₽", progress: 0.32 },
          { level: "Middle", range: "52-59 тыс. ₽", progress: 0.5 },
          { level: "Senior", range: "106-459 тыс. ₽", progress: 1 },
        ]}
      />
    );

    expect(screen.getByText("Уровень зарплат в Чебоксарах")).toBeInTheDocument();
    expect(screen.getByText("Senior").closest(".ui-career-salary-panel__item")).toHaveClass("is-highlighted");
  });

  it("renders the course and opportunity cards with actions and chips", () => {
    render(
      <>
        <CareerCourseCard
          meta="Продвинутый · 3 мес + онлайн"
          title="Нейросети для дизайна"
          provider="Яндекс Практикум"
          price="40 000 ₽"
          oldPrice="82 000 ₽"
          monthly="2325 ₽ в месяц"
          href="#course"
        />
        <CareerOpportunityCard
          featured
          type="Стажировка"
          status="Активно"
          statusTone="success"
          title="Веб-дизайнер"
          company="White Tiger Soft"
          accent="Длительность: 8 недель"
          chips={["Студенты", "Без опыта"]}
          href="#opportunity"
        />
      </>
    );

    expect(screen.getByRole("link", { name: "Перейти к курсу" })).toHaveAttribute("href", "#course");
    expect(screen.getByText("40 000 ₽")).toBeInTheDocument();
    expect(screen.getByText("Веб-дизайнер").closest(".ui-career-opportunity-card")).toHaveClass("ui-career-opportunity-card--featured");
    expect(screen.getByText("Студенты")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сохранить возможность" })).toBeInTheDocument();
  });

  it("renders mentor avatar fallback and shared-skills peer card", () => {
    render(
      <>
        <CareerMentorCard
          name="Мария Соколова"
          role="Карьерный консультант"
          summary="Сертифицированный карьерный консультант."
          href="#mentor"
        />
        <CareerPeerCard
          name="Александра Морева"
          initials="АМ"
          sharedSkills={["Web-design", "UX", "Figma"]}
          href="#peer"
        />
      </>
    );

    expect(screen.getByText("МС")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Профиль" })).toHaveAttribute("href", "#mentor");
    expect(screen.getByText("3 общих навыка: Web-design, UX, Figma")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Добавить в контакты" })).toHaveAttribute("href", "#peer");
  });
});
