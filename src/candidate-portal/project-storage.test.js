import { describe, expect, it } from "vitest";
import {
  createInitialProjectDraft,
  createProjectParticipantDraft,
  createProjectPreviewItem,
  validateProjectDraft,
} from "./project-storage";

function createValidDraft(overrides = {}) {
  return {
    ...createInitialProjectDraft(),
    title: "Платформа командной аналитики",
    projectType: "Учебный проект",
    shortDescription: "Веб-платформа для совместной работы с данными.",
    organization: "Трамплин Lab",
    role: "Frontend developer",
    teamSize: "3",
    startMonth: "2025-09",
    endMonth: "2026-02",
    problem: "Команде нужен был единый интерфейс для аналитики.",
    contribution: "Собрал интерфейс, редактор проектов и формы.",
    result: "Команда получила единый рабочий процесс и быстрые релизы.",
    tags: ["React", "UX"],
    ...overrides,
  };
}

describe("project-storage", () => {
  it("accepts uploaded cover images and normalizes participants", () => {
    const participant = createProjectParticipantDraft({
      name: "Анна Петрова",
      role: "Product designer",
    });
    const draft = createValidDraft({
      coverImageUrl: "data:image/png;base64,ZmFrZQ==",
      participants: [participant],
    });

    const { errors, normalized } = validateProjectDraft(draft);
    const previewItem = createProjectPreviewItem(draft);

    expect(errors).toEqual({});
    expect(normalized.coverImageUrl).toBe("data:image/png;base64,ZmFrZQ==");
    expect(normalized.participants).toEqual([
      {
        name: "Анна Петрова",
        role: "Product designer",
      },
    ]);
    expect(previewItem.coverImageUrl).toBe("data:image/png;base64,ZmFrZQ==");
    expect(previewItem.participants).toHaveLength(1);
  });

  it("requires participant names and checks team size", () => {
    const draft = createValidDraft({
      teamSize: "1",
      participants: [
        createProjectParticipantDraft({ name: "", role: "Backend developer" }),
        createProjectParticipantDraft({ name: "Илья Смирнов", role: "Designer" }),
      ],
    });

    const { errors } = validateProjectDraft(draft);

    expect(errors.participants).toBe("Укажите имя для каждого добавленного участника.");
    expect(errors.teamSize).toBe("Количество участников не может быть больше размера команды.");
  });
});
