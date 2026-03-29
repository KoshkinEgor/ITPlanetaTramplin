import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/http";
import { getCandidateRecommendations } from "../api/candidate";
import { getOpportunities } from "../api/opportunities";
import { writeFavoriteCompanyIds, writeFavoriteOpportunityIds } from "../features/favorites/storage";
import { HomeApp, scrollToHashTarget } from "./HomeApp";

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
  HomeOpportunityMap: ({ items, selectedCityCoordinates }) => (
    <div
      data-testid="home-opportunity-map"
      data-selected-longitude={selectedCityCoordinates?.[0] ?? ""}
      data-selected-latitude={selectedCityCoordinates?.[1] ?? ""}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          data-favorite={item.isFavoriteOpportunity ? "true" : "false"}
          data-company-favorite={item.isFavoriteCompanyOpportunity ? "true" : "false"}
        >
          {item.title}
        </button>
      ))}
    </div>
  ),
}));

function renderApp(initialEntries = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
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

  it("scrolls to the requested hash target with the configured offset", () => {
    const element = document.createElement("section");
    element.id = "about";
    document.body.appendChild(element);

    const scrollToMock = vi.fn();
    const rectSpy = vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
      top: 420,
      left: 0,
      width: 0,
      height: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 420,
      toJSON() {
        return this;
      },
    });
    const originalScrollTo = window.scrollTo;
    const originalScrollY = window.scrollY;

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 80,
    });
    window.scrollTo = scrollToMock;

    expect(scrollToHashTarget("#about", { offset: 100, behavior: "auto" })).toBe(true);
    expect(scrollToMock).toHaveBeenCalledWith({ top: 400, behavior: "auto" });

    rectSpy.mockRestore();
    window.scrollTo = originalScrollTo;
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: originalScrollY,
    });
    element.remove();
  });

  it("shows personalized recommendation cards from the candidate recommendations endpoint", async () => {
    getOpportunities.mockResolvedValue([
      {
        id: "vacancy-1",
        employerId: 1,
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
        employerId: 2,
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
        employerId: 1,
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

    expect(await screen.findAllByText("Popular Vacancy Only")).toHaveLength(3);
    await waitFor(() => expect(getCandidateRecommendations).toHaveBeenCalledTimes(1));
  });

  it("passes direct and company favorites to the home map and reacts to storage updates", async () => {
    getOpportunities.mockResolvedValue([
      {
        id: "fav-1",
        employerId: 11,
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
      {
        id: "company-fav-1",
        employerId: 22,
        opportunityType: "mentoring",
        title: "Company Favorite Mentoring",
        companyName: "Mentor Hub",
        locationCity: "Чебоксары",
        locationAddress: "Ярославская, 4",
        employmentType: "online",
        description: "Mentoring opportunity visible on the home map.",
        tags: ["Mentoring"],
        longitude: 47.2442,
        latitude: 56.1322,
      },
    ]);

    renderApp();

    expect(await screen.findByRole("button", { name: "Favorite on Home Map" })).toHaveAttribute("data-favorite", "false");
    expect(screen.getByRole("button", { name: "Company Favorite Mentoring" })).toHaveAttribute("data-company-favorite", "false");

    writeFavoriteOpportunityIds(["fav-1"]);
    writeFavoriteCompanyIds(["22"]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Favorite on Home Map" })).toHaveAttribute("data-favorite", "true");
      expect(screen.getByRole("button", { name: "Company Favorite Mentoring" })).toHaveAttribute("data-company-favorite", "true");
    });
  });

  it("renders the mentoring label in the home discovery area", async () => {
    getOpportunities.mockResolvedValue([
      {
        id: "mentor-1",
        employerId: 22,
        opportunityType: "mentoring",
        title: "Mentoring Track",
        companyName: "Mentor Hub",
        locationCity: "Москва",
        locationAddress: "Онлайн",
        employmentType: "online",
        description: "Mentoring program.",
        tags: ["Career"],
        longitude: 37.617635,
        latitude: 55.755814,
      },
    ]);

    renderApp();

    expect(await screen.findByText("Менторская программа")).toBeInTheDocument();
  });

  it("keeps a duplicate city selection by coordinates instead of matching only by name", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            name: "Москва",
            admin1: "Москва",
            country: "Россия",
            country_code: "RU",
            latitude: 55.755814,
            longitude: 37.617635,
          },
          {
            name: "Москва",
            admin1: "Тверская область",
            country: "Россия",
            country_code: "RU",
            latitude: 57.01234,
            longitude: 35.99876,
          },
        ],
      }),
    });

    getOpportunities.mockResolvedValue([
      {
        id: "city-1",
        employerId: 7,
        opportunityType: "vacancy",
        title: "Coordinate Driven City",
        companyName: "Atlas",
        locationCity: "Москва",
        locationAddress: "Тестовая улица, 1",
        employmentType: "remote",
        description: "Map selection should follow selected coordinates.",
        tags: ["React"],
        longitude: 37.617635,
        latitude: 55.755814,
      },
    ]);

    renderApp();

    const input = await screen.findByRole("combobox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Москва" } });

    const targetOption = await screen.findByRole("option", { name: /Москва, Тверская область/i });
    fireEvent.click(targetOption);

    await waitFor(() => {
      expect(screen.getByTestId("home-opportunity-map")).toHaveAttribute("data-selected-longitude", "35.99876");
      expect(screen.getByTestId("home-opportunity-map")).toHaveAttribute("data-selected-latitude", "57.01234");
    });

    fetchMock.mockRestore();
  });

  it("shows normalized quick filters with the default 'Все' state and real options only", async () => {
    getOpportunities.mockResolvedValue([
      {
        id: "internship-1",
        employerId: 3,
        opportunityType: "internship",
        title: "UI Internship",
        companyName: "Design Lab",
        locationCity: "Москва",
        locationAddress: "Ленинградский проспект, 12",
        employmentType: "online",
        description: "Internship for juniors.",
        tags: ["UI/UX", "Junior"],
        longitude: 37.58,
        latitude: 55.75,
      },
    ]);

    renderApp();

    expect(await screen.findByText("Тип : Все")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Тип" }));

    expect(screen.getByRole("option", { name: "Все" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Стажировка" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Тип" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: "Стажировка" }));

    expect(screen.getByText("Тип : Стажировка")).toBeInTheDocument();
  });

  it("keeps no-coordinate opportunities in the list while the map receives only point-based items", async () => {
    getOpportunities.mockResolvedValue([
      {
        id: "mapped-1",
        employerId: 10,
        opportunityType: "vacancy",
        title: "Mapped Opportunity",
        companyName: "Signal Hub",
        locationCity: "Чебоксары",
        locationAddress: "Президентский бульвар, 3",
        employmentType: "remote",
        description: "Visible on the map and in the list.",
        tags: ["React"],
        longitude: 47.251942,
        latitude: 56.1439,
      },
      {
        id: "list-only-1",
        employerId: 11,
        opportunityType: "internship",
        title: "List Only Internship",
        companyName: "Signal Hub",
        locationCity: "Чебоксары",
        locationAddress: "Онлайн",
        employmentType: "online",
        description: "Should stay visible in the list without map coordinates.",
        tags: ["UI/UX"],
      },
    ]);

    const { container } = renderApp();

    await waitFor(() => {
      const resultsGrid = container.querySelector(".home-results-grid");
      expect(resultsGrid).not.toBeNull();
      expect(within(resultsGrid).getByText("List Only Internship")).toBeInTheDocument();
    });
    expect(within(screen.getByTestId("home-opportunity-map")).getByRole("button", { name: "Mapped Opportunity" })).toBeInTheDocument();
    expect(within(screen.getByTestId("home-opportunity-map")).queryByRole("button", { name: "List Only Internship" })).not.toBeInTheDocument();

    const renderedCards = [...container.querySelectorAll(".home-opportunity-entry")].map((node) => node.textContent ?? "");
    expect(renderedCards[0]).toContain("Mapped Opportunity");
    expect(renderedCards[1]).toContain("List Only Internship");
  });
});
