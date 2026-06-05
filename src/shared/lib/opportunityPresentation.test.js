import { describe, expect, it } from "vitest";
import {
  buildOpportunityPayload,
  validateOpportunityDraftForSubmit,
  getFriendlyErrorMessage,
} from "./opportunityPresentation";

describe("buildOpportunityPayload", () => {
  it("serializes event dates as Unix seconds for the backend DTO", () => {
    const eventStartAt = "2026-06-10T12:00";
    const registrationDeadline = "2026-06-09T12:00";
    const payload = buildOpportunityPayload({
      opportunityType: "event",
      eventStartAt,
      registrationDeadline,
    });

    expect(payload.eventStartAt).toBe(Math.floor(new Date(eventStartAt).getTime() / 1000));
    expect(payload.registrationDeadline).toBe(Math.floor(new Date(registrationDeadline).getTime() / 1000));
  });
});

describe("validateOpportunityDraftForSubmit", () => {
  it("returns errors when required title and description are missing", () => {
    const errors = validateOpportunityDraftForSubmit({
      opportunityType: "vacancy",
      title: "",
      description: "",
      contacts: [{ value: "test@example.com" }],
      employmentType: "online",
      schedule: "fulltime",
      salaryFrom: 100,
      salaryTo: 200,
    });
    expect(errors).toContain("Укажите название публикации.");
    expect(errors).toContain("Добавьте описание публикации.");
  });

  it("returns error when contacts list is empty", () => {
    const errors = validateOpportunityDraftForSubmit({
      opportunityType: "vacancy",
      title: "Backend Dev",
      description: "Super job",
      contacts: [],
      employmentType: "online",
      schedule: "fulltime",
      salaryFrom: 100,
      salaryTo: 200,
    });
    expect(errors).toContain("Укажите хотя бы один контакт.");
  });

  it("returns error when contacts list has only empty values", () => {
    const errors = validateOpportunityDraftForSubmit({
      opportunityType: "vacancy",
      title: "Backend Dev",
      description: "Super job",
      contacts: [{ value: "" }, { value: "   " }],
      employmentType: "online",
      schedule: "fulltime",
      salaryFrom: 100,
      salaryTo: 200,
    });
    expect(errors).toContain("Укажите хотя бы один контакт.");
  });

  it("returns error when employment format is missing or unspecified", () => {
    const errors = validateOpportunityDraftForSubmit({
      opportunityType: "vacancy",
      title: "Backend Dev",
      description: "Super job",
      contacts: [{ value: "test@example.com" }],
      employmentType: "unspecified",
      schedule: "fulltime",
      salaryFrom: 100,
      salaryTo: 200,
    });
    expect(errors).toContain("Укажите формат занятости.");
  });

  it("returns error when offline/hybrid opportunity misses city", () => {
    const errors = validateOpportunityDraftForSubmit({
      opportunityType: "vacancy",
      title: "Backend Dev",
      description: "Super job",
      contacts: [{ value: "test@example.com" }],
      employmentType: "hybrid",
      locationCity: "",
      schedule: "fulltime",
      salaryFrom: 100,
      salaryTo: 200,
    });
    expect(errors).toContain("Укажите город для офлайн или гибридной возможности.");
  });

  it("returns error when offline/hybrid event misses address", () => {
    const errors = validateOpportunityDraftForSubmit({
      opportunityType: "event",
      title: "Meetup",
      description: "Awesome meetup",
      contacts: [{ value: "test@example.com" }],
      employmentType: "office",
      locationCity: "Москва",
      locationAddress: "",
      eventStartAt: "2026-06-10T12:00",
      registrationDeadline: "2026-06-09T12:00",
    });
    expect(errors).toContain("Укажите адрес для офлайн или гибридного мероприятия.");
  });

  it("returns error when vacancy salaryFrom > salaryTo", () => {
    const errors = validateOpportunityDraftForSubmit({
      opportunityType: "vacancy",
      title: "Backend Dev",
      description: "Super job",
      contacts: [{ value: "test@example.com" }],
      employmentType: "online",
      schedule: "fulltime",
      salaryFrom: 1000,
      salaryTo: 500,
    });
    expect(errors).toContain("Минимальная зарплата не может быть больше максимальной.");
  });

  it("allows vacancy without salaryTo", () => {
    const errors = validateOpportunityDraftForSubmit({
      opportunityType: "vacancy",
      title: "Backend Dev",
      description: "Super job",
      contacts: [{ value: "test@example.com" }],
      employmentType: "online",
      schedule: "fulltime",
      salaryFrom: 100,
      salaryTo: null,
    });
    expect(errors).not.toContain("Для вакансии укажите минимальную зарплату.");
    expect(errors).not.toContain("Минимальная зарплата не может быть больше максимальной.");
  });

  it("returns error when vacancy salaryFrom is missing", () => {
    const errors = validateOpportunityDraftForSubmit({
      opportunityType: "vacancy",
      title: "Backend Dev",
      description: "Super job",
      contacts: [{ value: "test@example.com" }],
      employmentType: "online",
      schedule: "fulltime",
      salaryFrom: null,
      salaryTo: 200,
    });
    expect(errors).toContain("Для вакансии укажите минимальную зарплату.");
  });

  it("returns error when paid internship stipendFrom > stipendTo", () => {
    const errors = validateOpportunityDraftForSubmit({
      opportunityType: "internship",
      title: "Dev Intern",
      description: "Super internship",
      contacts: [{ value: "test@example.com" }],
      employmentType: "online",
      schedule: "fulltime",
      isPaid: true,
      stipendFrom: 500,
      stipendTo: 200,
      duration: "3 months",
    });
    expect(errors).toContain("Минимальная стипендия не может быть больше максимальной.");
  });

  it("returns error when event registration deadline is after event start date", () => {
    const errors = validateOpportunityDraftForSubmit({
      opportunityType: "event",
      title: "Meetup",
      description: "Awesome meetup",
      contacts: [{ value: "test@example.com" }],
      employmentType: "online",
      eventStartAt: "2026-06-10T12:00",
      registrationDeadline: "2026-06-11T12:00",
    });
    expect(errors).toContain("Дедлайн регистрации не может быть позже даты события.");
  });

  it("returns error when mentoring program has seatsCount <= 0", () => {
    const errors = validateOpportunityDraftForSubmit({
      opportunityType: "mentoring",
      title: "Mentorship",
      description: "Experienced mentor",
      contacts: [{ value: "test@example.com" }],
      employmentType: "online",
      duration: "1 month",
      meetingFrequency: "once a week",
      seatsCount: 0,
    });
    expect(errors).toContain("Для менторской программы укажите количество мест больше нуля.");
  });
});

describe("getFriendlyErrorMessage", () => {
  it("returns default message when error is empty", () => {
    expect(getFriendlyErrorMessage(null, "Test default")).toBe("Test default");
  });

  it("handles network TypeError with fetch", () => {
    const err = new TypeError("Failed to fetch");
    expect(getFriendlyErrorMessage(err)).toBe("Не удалось связаться с сервером. Проверьте интернет-соединение.");
  });

  it("handles status 401, 403, 404, 500", () => {
    const err401 = { name: "ApiError", status: 401 };
    expect(getFriendlyErrorMessage(err401)).toBe("Вы не авторизованы. Войдите в систему заново.");

    const err403 = { name: "ApiError", status: 403 };
    expect(getFriendlyErrorMessage(err403)).toBe("Недостаточно прав для выполнения этого действия.");

    const err404 = { name: "ApiError", status: 404 };
    expect(getFriendlyErrorMessage(err404)).toBe("Запрашиваемая публикация не найдена.");

    const err500 = { name: "ApiError", status: 500 };
    expect(getFriendlyErrorMessage(err500)).toBe("Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.");
  });

  it("handles status 400 / 409 with Cyrillic validation errors", () => {
    const cyrillicErr = { name: "ApiError", status: 400, message: "Неверный ИНН" };
    expect(getFriendlyErrorMessage(cyrillicErr)).toBe("Неверный ИНН");
  });

  it("handles status 400 / 409 with English backend exceptions", () => {
    const englishErr = { name: "ApiError", status: 400, message: "Invalid value structure" };
    expect(getFriendlyErrorMessage(englishErr)).toBe("Некорректно заполнены поля формы. Проверьте введенные данные.");
  });

  it("handles generic Cyrillic error messages", () => {
    const genericErr = new Error("Какая-то ошибка");
    expect(getFriendlyErrorMessage(genericErr)).toBe("Какая-то ошибка");
  });
});
