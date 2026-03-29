import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCandidateProfile } from "../api/candidate";
import { getOpportunities } from "../api/opportunities";
import {
  FAVORITE_COMPANY_IDS_STORAGE_KEY,
  FAVORITE_OPPORTUNITY_IDS_STORAGE_KEY,
  writeFavoriteCompanyIds,
  writeFavoriteOpportunityIds,
} from "../features/favorites/storage";
import { OpportunitiesCatalogApp } from "./OpportunitiesCatalogApp";

vi.mock("../api/opportunities", () => ({
  getOpportunities: vi.fn(),
}));

vi.mock("../api/candidate", () => ({
  getCandidateProfile: vi.fn(),
}));

vi.mock("../home/HomeOpportunityMap", () => ({
  HomeOpportunityMap: ({ items, selectedCity, activeId, onSelectItem }) => (
    <div data-testid="catalog-map" data-city={selectedCity} data-active-id={activeId ?? ""}>
      <p>MAP_POINTS:{items.length}</p>
      {items.length ? (
        items.map((item) => (
          <button
            key={item.id}
            type="button"
            data-favorite={item.isFavoriteOpportunity ? "true" : "false"}
            data-company-favorite={item.isFavoriteCompanyOpportunity ? "true" : "false"}
            onClick={() => onSelectItem?.(item.id)}
          >
            {item.title}
          </button>
        ))
      ) : (
        <p>Нет точек по текущим фильтрам</p>
      )}
    </div>
  ),
}));

const opportunities = [
  {
    id: 1,
    employerId: 101,
    title: "Junior Security Analyst",
    companyName: "IGrids",
    locationCity: "Москва",
    locationAddress: "Ленинградский проспект, 39",
    description: "SOC monitoring, SIEM triage, and first-line incident review for junior specialists.",
    tags: ["Security", "Junior", "SOC"],
    opportunityType: "vacancy",
    employmentType: "remote",
    salaryFrom: 120000,
    salaryTo: 180000,
    longitude: 37.617635,
    latitude: 55.755814,
    moderationStatus: "approved",
  },
  {
    id: 2,
    employerId: 202,
    title: "IT-Планета",
    companyName: "IT-Планета",
    locationCity: "Чебоксары",
    locationAddress: "Онлайн",
    description: "Open event for students and junior teams.",
    tags: ["Студенты", "Мероприятие"],
    opportunityType: "event",
    employmentType: "online",
    eventStartAt: "2026-04-18T18:30:00Z",
    registrationDeadline: "2026-04-10T21:00:00Z",
    longitude: 37.541584,
    latitude: 55.804065,
    moderationStatus: "approved",
  },
  {
    id: 3,
    employerId: 303,
    title: "Mobile UI/UX",
    companyName: "White Tiger Soft",
    locationCity: "Москва",
    locationAddress: "Лесная, 12",
    description: "Paid internship for mobile product design.",
    tags: ["UI / UX", "Дизайн"],
    opportunityType: "internship",
    employmentType: "hybrid",
    isPaid: false,
    duration: "10 недель",
    longitude: 37.658581,
    latitude: 55.762994,
    moderationStatus: "approved",
  },
  {
    id: 4,
    employerId: 101,
    title: "Frontend Intern",
    companyName: "IGrids",
    locationCity: "Чебоксары",
    locationAddress: "Московский проспект, 17",
    description: "React internship with real feature ownership.",
    tags: ["Frontend", "React"],
    opportunityType: "internship",
    employmentType: "remote",
    longitude: 47.251942,
    latitude: 56.1439,
    moderationStatus: "approved",
  },
  {
    id: 5,
    employerId: 404,
    title: "QA Engineer",
    companyName: "Case Systems",
    locationCity: "Чебоксары",
    locationAddress: "Президентский бульвар, 1",
    description: "Manual QA vacancy for product teams.",
    tags: ["QA", "Junior"],
    opportunityType: "vacancy",
    employmentType: "office",
    moderationStatus: "approved",
  },
  {
    id: 6,
    employerId: 505,
    title: "Junior Security Analyst",
    companyName: "Shield Ops",
    locationCity: "Чебоксары",
    locationAddress: "Ярославская, 29",
    description: "SOC monitoring and SIEM triage for junior analysts in the local team.",
    tags: ["Security", "Junior", "SOC"],
    opportunityType: "vacancy",
    employmentType: "remote",
    longitude: 47.2442,
    latitude: 56.1322,
    moderationStatus: "approved",
  },
  {
    id: 7,
    employerId: 404,
    title: "Product Designer",
    companyName: "Case Systems",
    locationCity: "Чебоксары",
    locationAddress: "Калинина, 7",
    description: "Design systems and product discovery for regional B2B tools.",
    tags: ["Design", "Product"],
    opportunityType: "internship",
    employmentType: "hybrid",
    longitude: 47.2674,
    latitude: 56.1337,
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
    window.localStorage.clear();
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
    expect(screen.getByText(/В каталоге сейчас/i)).toBeInTheDocument();
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
    expect(slider.closest(".ui-kit-slider-showcase__section")).not.toBeNull();
    expect(slider.querySelector(".ui-kit-opportunity-slider__card")).not.toBeNull();
  });

  it("renders event-specific semantic facts in list cards", async () => {
    getOpportunities.mockResolvedValue(opportunities);
    getCandidateProfile.mockResolvedValue(null);

    renderApp();

    await waitFor(() => {
      expect(document.querySelector(".opportunities-browser__results")).not.toBeNull();
    });
    const results = document.querySelector(".opportunities-browser__results");
    expect(results).not.toBeNull();
    expect(within(results).getAllByText("IT-Планета").length).toBeGreaterThan(0);
    expect(within(results).getByText("Дата и время")).toBeInTheDocument();
    expect(within(results).getByText(/Регистрация до/)).toBeInTheDocument();
    expect(within(results).getByText("Онлайн • Чебоксары")).toBeInTheDocument();
  });

  it("opens filters as a dropdown, applies real filters, and keeps unsupported controls disabled", async () => {
    getOpportunities.mockResolvedValue(opportunities);
    getCandidateProfile.mockResolvedValue(null);

    const { container } = renderApp();
    expect(await screen.findAllByRole("heading", { name: "Junior Security Analyst" })).not.toHaveLength(0);
    const results = container.querySelector(".opportunities-browser__results");

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Junior" } });
    fireEvent.click(screen.getByRole("button", { name: "Вакансии" }));
    fireEvent.click(screen.getByRole("button", { name: "Фильтры" }));
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
    expect(within(results).getByText("IT-Планета")).toBeInTheDocument();
    expect(within(results).getByText("Frontend Intern")).toBeInTheDocument();
    expect(within(results).getByText("QA Engineer")).toBeInTheDocument();
    expect(within(results).queryByText("Junior Security Analyst")).not.toBeInTheDocument();
    expect(within(results).queryByText("Product Designer")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Больше возможностей" }));

    expect(within(results).getByText("Product Designer")).toBeInTheDocument();
  });

  it("saves an opportunity id to localStorage from the catalog results", async () => {
    getOpportunities.mockResolvedValue(opportunities);
    getCandidateProfile.mockResolvedValue(null);

    const { container } = renderApp();
    await screen.findAllByRole("heading", { name: "Junior Security Analyst" });
    const results = container.querySelector(".opportunities-browser__results");

    expect(results).not.toBeNull();

    const firstResultCard = results.querySelector('[data-opportunity-id="4"]');
    expect(firstResultCard).not.toBeNull();

    const favoriteButton = within(firstResultCard).getByRole("button", { name: "Сохранить возможность" });
    fireEvent.click(favoriteButton);

    expect(JSON.parse(window.localStorage.getItem(FAVORITE_OPPORTUNITY_IDS_STORAGE_KEY) ?? "[]")).toEqual(["4"]);
    expect(favoriteButton).toHaveAttribute("aria-pressed", "true");
  });

  it("switches to an inline map and preserves the current filters for mapped items", async () => {
    getOpportunities.mockResolvedValue(opportunities);
    getCandidateProfile.mockResolvedValue(null);

    renderApp();

    expect(await screen.findByRole("button", { name: "Карта" })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Junior" } });
    fireEvent.click(screen.getByRole("button", { name: "Вакансии" }));
    fireEvent.click(screen.getByRole("button", { name: "Карта" }));

    const mapPanel = screen.getByTestId("catalog-map").closest(".opportunities-browser__map-panel");
    expect(mapPanel).not.toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(screen.getByText("MAP_POINTS:1")).toBeInTheDocument();
  });

  it("filters map items by favorites-only display without affecting the catalog list", async () => {
    getOpportunities.mockResolvedValue(opportunities);
    getCandidateProfile.mockResolvedValue(null);
    writeFavoriteOpportunityIds(["4"]);

    renderApp();

    expect(await screen.findByRole("button", { name: "Карта" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Карта" }));

    const map = screen.getByTestId("catalog-map");
    expect(within(map).getByRole("button", { name: "Frontend Intern" })).toHaveAttribute("data-favorite", "true");
    expect(screen.getByText("MAP_POINTS:4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Фильтры карты" }));
    fireEvent.click(screen.getByRole("button", { name: "Только избранное" }));

    expect(screen.getByText("MAP_POINTS:1")).toBeInTheDocument();
    expect(within(map).getByRole("button", { name: "Frontend Intern" })).toHaveAttribute("data-favorite", "true");

    fireEvent.click(screen.getByRole("button", { name: "Не избранное" }));

    expect(screen.getByText("MAP_POINTS:3")).toBeInTheDocument();
    expect(within(map).queryByRole("button", { name: "Frontend Intern" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Список" }));

    const results = document.querySelector(".opportunities-browser__results");
    expect(results).not.toBeNull();
    expect(within(results).getByText("Frontend Intern")).toBeInTheDocument();
    expect(within(results).getByText("QA Engineer")).toBeInTheDocument();
  });

  it("keeps the map interactive while the drawer is open and closes it with Escape", async () => {
    getOpportunities.mockResolvedValue(opportunities);
    getCandidateProfile.mockResolvedValue(null);

    const { container } = renderApp();
    expect(await screen.findByRole("button", { name: "Карта" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Карта" }));
    fireEvent.click(screen.getByRole("button", { name: "Фильтры карты" }));

    expect(screen.getByText("Регион")).toBeInTheDocument();
    expect(container.querySelector(".opportunity-filter-sidebar__drawer-backdrop")).toBeNull();

    fireEvent.click(within(screen.getByTestId("catalog-map")).getByRole("button", { name: "Frontend Intern" }));

    expect(screen.getByTestId("catalog-map")).toHaveAttribute("data-active-id", "4");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByText("Регион")).not.toBeInTheDocument();
  });

  it("updates favorite markers on the open map after favorites storage changes", async () => {
    getOpportunities.mockResolvedValue(opportunities);
    getCandidateProfile.mockResolvedValue(null);

    renderApp();

    expect(await screen.findByRole("button", { name: "Карта" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Карта" }));

    const map = screen.getByTestId("catalog-map");
    expect(within(map).getByRole("button", { name: "Frontend Intern" })).toHaveAttribute("data-favorite", "false");

    writeFavoriteOpportunityIds(["4"]);

    await waitFor(() => {
      expect(within(screen.getByTestId("catalog-map")).getByRole("button", { name: "Frontend Intern" })).toHaveAttribute(
        "data-favorite",
        "true"
      );
    });
  });

  it("shows the map empty state when filtered opportunities do not have coordinates", async () => {
    getOpportunities.mockResolvedValue(opportunities);
    getCandidateProfile.mockResolvedValue(null);

    renderApp();

    expect(await screen.findByRole("button", { name: "Карта" })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "QA Engineer" } });
    fireEvent.click(screen.getByRole("button", { name: "Карта" }));

    const mapPanel = screen.getByTestId("catalog-map").closest(".opportunities-browser__map-panel");
    expect(mapPanel).not.toBeNull();
    expect(screen.getByText("MAP_POINTS:0")).toBeInTheDocument();
    expect(within(mapPanel).getByText("Нет точек по текущим фильтрам")).toBeInTheDocument();
  });

  it("aggregates companies for the default city section", async () => {
    getOpportunities.mockResolvedValue(opportunities);
    getCandidateProfile.mockResolvedValue(null);

    renderApp();

    const caseSystems = await screen.findByText("Case Systems");
    const companiesCard = caseSystems.closest(".ui-card");

    expect(companiesCard).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Вакансии в Чебоксары" })).toBeInTheDocument();
    expect(within(companiesCard).getByText("Case Systems")).toBeInTheDocument();
    expect(within(companiesCard).getByText("Case Systems").closest("a")).toHaveAttribute("href", "/companies/404");
    expect(screen.getByRole("button", { name: "Чебоксары" })).toBeInTheDocument();
  });

  it("supports company favorites and propagates them to the map", async () => {
    getOpportunities.mockResolvedValue(opportunities);
    getCandidateProfile.mockResolvedValue(null);

    renderApp();

    const caseSystemsTile = await screen.findByText("Case Systems");
    const tileCard = caseSystemsTile.closest(".ui-company-vacancy-tile");

    expect(tileCard).not.toBeNull();

    fireEvent.click(within(tileCard).getByRole("button", { name: "Сохранить компанию" }));

    expect(JSON.parse(window.localStorage.getItem(FAVORITE_COMPANY_IDS_STORAGE_KEY) ?? "[]")).toEqual(["404"]);

    fireEvent.click(screen.getByRole("button", { name: "Карта" }));

    await waitFor(() => {
      expect(within(screen.getByTestId("catalog-map")).getByRole("button", { name: "Product Designer" })).toHaveAttribute(
        "data-company-favorite",
        "true"
      );
    });
  });

  it("shows the mentoring legend on the map", async () => {
    getOpportunities.mockResolvedValue(opportunities);
    getCandidateProfile.mockResolvedValue(null);

    renderApp();

    fireEvent.click(await screen.findByRole("button", { name: "Карта" }));

    expect(screen.getByText("Менторская программа")).toBeInTheDocument();
  });
});
