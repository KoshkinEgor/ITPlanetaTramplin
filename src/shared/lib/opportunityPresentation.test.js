import { describe, expect, it } from "vitest";
import { getOpportunityCardPresentation } from "./opportunityPresentation";

describe("getOpportunityCardPresentation", () => {
  it("builds typed summary fields for vacancies", () => {
    const presentation = getOpportunityCardPresentation({
      opportunityType: "vacancy",
      companyName: "Shield Ops",
      locationCity: "Москва",
      employmentType: "remote",
      salaryFrom: 120000,
      salaryTo: 180000,
      moderationStatus: "approved",
    });

    expect(presentation.typeKey).toBe("vacancy");
    expect(presentation.typeTone).toBe("blue");
    expect(presentation.primaryFactLabel).toBe("Зарплата");
    expect(presentation.primaryFactValue).toContain("120");
    expect(presentation.primaryFactValue).toContain("180");
    expect(presentation.secondaryFact).toBe("Формат: Удаленно");
    expect(presentation.tertiaryFact).toBe("Город: Москва");
    expect(presentation.compactFact).toBe("Удаленно");
    expect(presentation.summaryFacts).toEqual(["Формат: Удаленно", "Город: Москва"]);
  });

  it("returns explicit vacancy fallbacks when salary and format are missing", () => {
    const presentation = getOpportunityCardPresentation({
      opportunityType: "vacancy",
      moderationStatus: "pending",
    });

    expect(presentation.primaryFactLabel).toBe("Зарплата");
    expect(presentation.primaryFactValue).toBe("Зарплата не указана");
    expect(presentation.secondaryFact).toBe("Формат не указан");
    expect(presentation.tertiaryFact).toBe("");
    expect(presentation.compactFact).toBe("Формат не указан");
  });

  it("builds typed summary fields for internships", () => {
    const presentation = getOpportunityCardPresentation({
      opportunityType: "internship",
      isPaid: false,
      duration: "3 месяца",
      employmentType: "hybrid",
      moderationStatus: "approved",
    });

    expect(presentation.typeKey).toBe("internship");
    expect(presentation.typeTone).toBe("green");
    expect(presentation.primaryFactLabel).toBe("Оплата");
    expect(presentation.primaryFactValue).toBe("Без оплаты");
    expect(presentation.secondaryFact).toBe("Длительность: 3 месяца");
    expect(presentation.tertiaryFact).toBe("Формат: Гибрид");
    expect(presentation.compactFact).toBe("Длительность: 3 месяца");
  });

  it("builds typed summary fields for events", () => {
    const presentation = getOpportunityCardPresentation({
      opportunityType: "event",
      eventStartAt: "2026-04-18T18:30:00Z",
      registrationDeadline: "2026-04-10T21:00:00Z",
      employmentType: "online",
      locationCity: "Казань",
      moderationStatus: "approved",
    });

    expect(presentation.typeKey).toBe("event");
    expect(presentation.typeTone).toBe("orange");
    expect(presentation.primaryFactLabel).toBe("Дата и время");
    expect(presentation.primaryFactValue).toContain("2026");
    expect(presentation.secondaryFact).toContain("Регистрация до");
    expect(presentation.secondaryFact).toContain("2026");
    expect(presentation.tertiaryFact).toBe("Онлайн • Казань");
    expect(presentation.compactFact).toContain("До");
  });

  it("builds typed summary fields for mentoring programs", () => {
    const presentation = getOpportunityCardPresentation({
      opportunityType: "mentoring",
      duration: "2 месяца",
      meetingFrequency: "1 раз в неделю",
      seatsCount: 8,
      moderationStatus: "approved",
    });

    expect(presentation.typeKey).toBe("mentoring");
    expect(presentation.typeTone).toBe("teal");
    expect(presentation.primaryFactLabel).toBe("Длительность");
    expect(presentation.primaryFactValue).toBe("2 месяца");
    expect(presentation.secondaryFact).toBe("Встречи: 1 раз в неделю");
    expect(presentation.tertiaryFact).toBe("Мест: 8");
    expect(presentation.compactFact).toBe("Встречи: 1 раз в неделю");
  });
});
