import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/http";
import { getCandidateRecommendations } from "../api/candidate";
import { getOpportunities } from "../api/opportunities";
import { writeFavoriteOpportunityIds } from "../features/favorites/storage";
import { HomeApp } from "./HomeApp";

vi.mock("../api/opportunities", () => ({
  getOpportunities: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../api/candidate", () => ({
  getCandidateRecommendations: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../auth/api", () => ({
  getCurrentAuthUser: vi.fn(() => Promise.resolve(null)),
  useAuthSession: vi.fn(() => ({ status: "guest", user: null, error: null })),
}));

vi.mock("../widgets/layout", () => ({
  PortalHeader: () => <div data-testid="portal-header" />,
}));

vi.mock("./HomeOpportunityMap", () => ({
  HomeOpportunityMap: ({ items }) => (
    <div data-testid="home-opportunity-map">
      {items.map((item) => (
        <button key={item.id} type="button" data-favorite={item.isFavorite ? "true" : "false"}>
          {item.title}
        </button>
      ))}
    </div>
  ),
}));

function renderApp() {
  return render(
    <MemoryRouter>
      <HomeApp />
    </MemoryRouter>
  );
}

describe("HomeApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    getOpportunities.mockResolvedValue([]);
    getCandidateRecommendations.mockResolvedValue([]);
  });

  it("shows personalized recommendation cards from the candidate recommendations endpoint", async () => {
    getOpportunities.mockResolvedValue([
      {
        id: "vacancy-1",
        opportunityType: "vacancy",
        title: "Popular Vacancy Only",
        companyName: "Signal Hub",
        locationCity: "Москва",
        employmentType: "remote",
        description: "Первая вакансия из публичного каталога.",
        tags: ["React"],
      },
    ]);
    getCandidateRecommendations.mockResolvedValue([
      {
        opportunityId: "recommendation-1",
        opportunityType: "internship",
        title: "Personal Recommendation",
        companyName: "Design Lab",
        locationCity: "Казань",
        duration: "8 недель",
        description: "Персональная рекомендация для кандидата.",
        tags: ["Figma", "UX"],
      },
    ]);

    renderApp();

    expect(await screen.findByText("Personal Recommendation")).toBeInTheDocument();
    await waitFor(() => expect(getCandidateRecommendations).toHaveBeenCalledTimes(1));
  });

  it("falls back to public opportunities when recommendations are unavailable", async () => {
    getOpportunities.mockResolvedValue([
      {
        id: "vacancy-1",
        opportunityType: "vacancy",
        title: "Popular Vacancy Only",
        companyName: "Signal Hub",
        locationCity: "Москва",
        employmentType: "remote",
        description: "Первая вакансия из публичного каталога.",
        tags: ["React"],
      },
    ]);
    getCandidateRecommendations.mockRejectedValue(new ApiError("Unauthorized", { status: 401 }));

    renderApp();

    expect(await screen.findAllByText("Popular Vacancy Only")).toHaveLength(2);
    await waitFor(() => expect(getCandidateRecommendations).toHaveBeenCalledTimes(1));
  });

  it("passes favorite opportunities to the home map and reacts to storage updates", async () => {
    getOpportunities.mockResolvedValue([
      {
        id: "fav-1",
        opportunityType: "vacancy",
        title: "Favorite on Home Map",
        companyName: "Signal Hub",
        locationCity: "Чебоксары",
        locationAddress: "Президентский бульвар, 1",
        employmentType: "remote",
        description: "Opportunity visible on the home map.",
        tags: ["React"],
        longitude: 47.251942,
        latitude: 56.1439,
      },
    ]);

    renderApp();

    expect(await screen.findByRole("button", { name: "Favorite on Home Map" })).toHaveAttribute("data-favorite", "false");

    writeFavoriteOpportunityIds(["fav-1"]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Favorite on Home Map" })).toHaveAttribute("data-favorite", "true");
    });
  });
});
