import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCandidateProfile } from "../api/candidate";
import { getOpportunities } from "../api/opportunities";
import { OpportunitiesCatalogApp } from "./OpportunitiesCatalogApp";

vi.mock("../api/opportunities", () => ({
  getOpportunities: vi.fn(),
}));

vi.mock("../api/candidate", () => ({
  getCandidateProfile: vi.fn(),
}));

const opportunities = [
  {
    id: 1,
    title: "Junior Security Analyst",
    companyName: "IGrids",
    locationCity: "Москва",
    description: "SOC monitoring, SIEM triage, and first-line incident review for junior specialists.",
    tags: ["Security", "Junior", "SOC"],
    opportunityType: "vacancy",
    employmentType: "remote",
    moderationStatus: "approved",
  },
  {
    id: 2,
    title: "IT-Планета",
    companyName: "IT-Планета",
    locationCity: "Москва",
    description: "Open event for students and junior teams.",
    tags: ["Студенты", "Мероприятие"],
    opportunityType: "event",
    employmentType: "online",
    moderationStatus: "approved",
  },
  {
    id: 3,
    title: "Mobile UI/UX",
    companyName: "White Tiger Soft",
    locationCity: "Москва",
    description: "Paid internship for mobile product design.",
    tags: ["UI / UX", "Дизайн"],
    opportunityType: "internship",
    employmentType: "hybrid",
    moderationStatus: "approved",
  },
  {
    id: 4,
    title: "Frontend Intern",
    companyName: "IGrids",
    locationCity: "Чебоксары",
    description: "React internship with real feature ownership.",
    tags: ["Frontend", "React"],
    opportunityType: "internship",
    employmentType: "remote",
    moderationStatus: "approved",
  },
  {
    id: 5,
    title: "QA Engineer",
    companyName: "Case Systems",
    locationCity: "Чебоксары",
    description: "Manual QA vacancy for product teams.",
    tags: ["QA", "Junior"],
    opportunityType: "vacancy",
    employmentType: "office",
    moderationStatus: "approved",
  },
];

function renderApp() {
  return render(
    <MemoryRouter>
      <OpportunitiesCatalogApp />
    </MemoryRouter>
  );
}

describe("OpportunitiesCatalogApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the loading state and cleans up the body class on unmount", () => {
    getOpportunities.mockImplementation(() => new Promise(() => {}));
    getCandidateProfile.mockImplementation(() => new Promise(() => {}));

    const { unmount } = renderApp();

    expect(document.body).toHaveClass("opportunities-browser-react-body");
    expect(screen.getByText("Загружаем каталог возможностей")).toBeInTheDocument();

    unmount();

    expect(document.body).not.toHaveClass("opportunities-browser-react-body");
  });

  it("shows an error state when the opportunities request fails", async () => {
    getOpportunities.mockRejectedValue(new Error("API down"));
    getCandidateProfile.mockResolvedValue(null);

    renderApp();

    expect(await screen.findByText("API down")).toBeInTheDocument();
  });

  it("falls back to the generic hero when the candidate profile is unavailable", async () => {
    getOpportunities.mockResolvedValue(opportunities);
    getCandidateProfile.mockRejectedValue({ status: 401 });

    renderApp();

    expect(await screen.findByRole("heading", { name: "Каталог возможностей для старта карьеры" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Мы проанализировали ваши навыки/i })).not.toBeInTheDocument();
    expect(screen.getByText(/В каталоге сейчас/)).toBeInTheDocument();
  });

  it("shows the personalized hero when candidate skills are available", async () => {
    getOpportunities.mockResolvedValue(opportunities);
    getCandidateProfile.mockResolvedValue({
      id: 1,
      name: "Anna",
      skills: ["Security", "SOC"],
    });

    renderApp();

    expect(await screen.findByRole("heading", { name: /Мы проанализировали ваши навыки/i })).toBeInTheDocument();
    expect(screen.getByText(/Тебе подходит/i)).toBeInTheDocument();
  });

  it("renders recommended opportunities with the ui-kit slider", async () => {
    getOpportunities.mockResolvedValue(opportunities);
    getCandidateProfile.mockResolvedValue({
      id: 1,
      name: "Anna",
      skills: ["Security", "SOC"],
    });

    renderApp();

    const slider = await screen.findByRole("region", { name: "Рекомендуемые возможности" });

    expect(within(slider).getByText("Junior Security Analyst")).toBeInTheDocument();
    expect(slider.querySelectorAll(".opportunity-block-slider__item")).toHaveLength(4);
  });

  it("applies real filters and keeps unsupported controls disabled", async () => {
    getOpportunities.mockResolvedValue(opportunities);
    getCandidateProfile.mockResolvedValue(null);

    const { container } = renderApp();
    expect(await screen.findAllByRole("heading", { name: "Junior Security Analyst" })).not.toHaveLength(0);
    const results = container.querySelector(".opportunities-browser__results");

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Junior" } });
    fireEvent.click(screen.getByRole("button", { name: "Вакансии" }));
    fireEvent.click(screen.getByLabelText("Удаленно"));

    expect(results).not.toBeNull();
    expect(within(results).getByText("Junior Security Analyst")).toBeInTheDocument();
    expect(within(results).queryByText("IT-Планета")).not.toBeInTheDocument();
    expect(within(results).queryByText("QA Engineer")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "По возрастанию зарплат" })).toBeDisabled();
    expect(screen.getByPlaceholderText("от")).toBeDisabled();
    expect(screen.getAllByText(/backend/i).length).toBeGreaterThan(0);
  });

  it("shows the first three opportunities and expands the list by three more", async () => {
    getOpportunities.mockResolvedValue(opportunities);
    getCandidateProfile.mockResolvedValue(null);

    const { container } = renderApp();
    expect(await screen.findAllByRole("heading", { name: "Junior Security Analyst" })).not.toHaveLength(0);
    const results = container.querySelector(".opportunities-browser__results");

    expect(results).not.toBeNull();
    expect(within(results).getByText("Mobile UI/UX")).toBeInTheDocument();
    expect(within(results).queryByText("Frontend Intern")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Больше возможностей" }));

    expect(within(results).getByText("Frontend Intern")).toBeInTheDocument();
    expect(within(results).getByText("QA Engineer")).toBeInTheDocument();
  });

  it("aggregates companies by city and lets the user switch the city in the section", async () => {
    getOpportunities.mockResolvedValue(opportunities);
    getCandidateProfile.mockResolvedValue(null);

    renderApp();

    const companiesHeading = await screen.findByRole("heading", { name: "Вакансии в Москва" });
    const companiesCard = companiesHeading.closest(".ui-card");

    expect(companiesCard).not.toBeNull();
    expect(within(companiesCard).getByText("IT-Планета")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Чебоксары" }));

    expect(screen.getByRole("heading", { name: "Вакансии в Чебоксары" })).toBeInTheDocument();
    expect(within(companiesCard).getByText("Case Systems")).toBeInTheDocument();
  });
});
