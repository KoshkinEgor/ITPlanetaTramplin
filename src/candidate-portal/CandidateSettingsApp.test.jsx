import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCandidateEducation,
  deleteCandidateEducation,
  getCandidateEducation,
  getCandidateProfile,
  updateCandidateEducation,
  updateCandidateProfile,
} from "../api/candidate";
import { CandidateSettingsApp } from "./CandidateSettingsApp";

vi.mock("../api/candidate", () => ({
  createCandidateEducation: vi.fn(() => Promise.resolve({})),
  deleteCandidateEducation: vi.fn(() => Promise.resolve({})),
  getCandidateEducation: vi.fn(() => Promise.resolve([])),
  getCandidateProfile: vi.fn(() => Promise.resolve({})),
  updateCandidateEducation: vi.fn(() => Promise.resolve({})),
  updateCandidateProfile: vi.fn((body) => Promise.resolve(body)),
}));

const profile = {
  name: "Anna",
  surname: "Kovaleva",
  thirdname: "",
  description: "Product-minded candidate",
  email: "anna@example.com",
  skills: ["SQL", "UX"],
  links: {
    onboarding: {
      profession: "Designer",
      birthDate: "2002-04-12",
      city: "Moscow",
      citizenship: "Россия",
    },
  },
};

function renderApp(initialEntry = "/candidate/settings?section=settings-profile") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <CandidateSettingsApp />
    </MemoryRouter>
  );
}

describe("CandidateSettingsApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCandidateProfile.mockResolvedValue(profile);
    getCandidateEducation.mockResolvedValue([]);
    updateCandidateProfile.mockImplementation(async (body) => ({
      ...profile,
      ...body,
      links: body.links ?? profile.links,
      skills: body.skills ?? profile.skills,
    }));
  });

  it("allows collapsing the personal info section completely", async () => {
    renderApp();

    expect(await screen.findByDisplayValue("Anna")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { expanded: true }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("Anna")).not.toBeVisible();
    });
  });

  it("uploads a profile photo and includes it in the save payload", async () => {
    class MockFileReader {
      constructor() {
        this.onload = null;
        this.onerror = null;
        this.result = null;
      }

      readAsDataURL() {
        this.result = "data:image/png;base64,avatar";
        this.onload?.();
      }
    }

    vi.stubGlobal("FileReader", MockFileReader);

    renderApp();

    expect(await screen.findByDisplayValue("Anna")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Загрузить фото профиля"), {
      target: {
        files: [new File(["avatar"], "avatar.png", { type: "image/png" })],
      },
    });

    expect(await screen.findByRole("img", { name: "Фото профиля" })).toHaveAttribute("src", "data:image/png;base64,avatar");

    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => {
      expect(updateCandidateProfile).toHaveBeenCalledWith(expect.objectContaining({
        name: "Anna",
        surname: "Kovaleva",
        links: expect.objectContaining({
          avatarUrl: "data:image/png;base64,avatar",
        }),
      }));
    });

    vi.unstubAllGlobals();
  });
});
