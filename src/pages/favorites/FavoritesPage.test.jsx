import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOpportunities } from "../../api/opportunities";
import { writeFavoriteCompanyIds, writeFavoriteOpportunityIds } from "../../features/favorites/storage";
import { FavoritesPage } from "./FavoritesPage";

vi.mock("../../api/opportunities", () => ({
  getOpportunities: vi.fn(),
}));

vi.mock("../../widgets/layout", () => ({
  PortalHeader: () => <div data-testid="portal-header" />,
}));

const opportunities = [
  {
    id: 1,
    employerId: 10,
    companyName: "Northwind",
    locationCity: "Москва",
    locationAddress: "Ленинградский проспект, 1",
    description: "Mentoring flow for junior specialists.",
    tags: ["Security"],
    opportunityType: "mentoring",
    moderationStatus: "approved",
    title: "Менторская программа",
    duration: "2 месяца",
    meetingFrequency: "1 раз в неделю",
    seatsCount: 6,
  },
  {
    id: 2,
    employerId: 10,
    companyName: "Northwind",
    locationCity: "Москва",
    locationAddress: "Ленинградский проспект, 1",
    description: "Frontend internship.",
    tags: ["Frontend"],
    opportunityType: "internship",
    moderationStatus: "approved",
    title: "Frontend internship",
    isPaid: false,
    duration: "8 недель",
    employmentType: "hybrid",
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <FavoritesPage />
    </MemoryRouter>
  );
}

describe("FavoritesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    getOpportunities.mockResolvedValue(opportunities);
  });

  it("shows one common empty state when favorites are empty", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Соберите избранное" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Избранные возможности" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Избранные компании" })).not.toBeInTheDocument();
  });

  it("renders separate sections for favorite opportunities and companies with typed facts", async () => {
    writeFavoriteOpportunityIds(["1"]);
    writeFavoriteCompanyIds(["10"]);

    renderPage();

    expect(await screen.findByRole("heading", { name: "Избранные возможности" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Избранные компании" })).toBeInTheDocument();
    expect(screen.getByText("Northwind")).toBeInTheDocument();
    expect(screen.getByText("Northwind").closest("a")).toHaveAttribute("href", "/companies/10");
    expect(screen.getAllByText("Менторская программа").length).toBeGreaterThan(0);
    expect(screen.getByText("Длительность")).toBeInTheDocument();
    expect(screen.getByText("2 месяца")).toBeInTheDocument();
    expect(screen.getByText("Встречи: 1 раз в неделю")).toBeInTheDocument();
  });

  it("removes a company from favorites via the company section", async () => {
    writeFavoriteCompanyIds(["10"]);

    renderPage();

    const removeButton = await screen.findByRole("button", { name: "Убрать компанию из избранного" });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem("tramplin.favoriteCompanyIds") ?? "[]")).toEqual([]);
    });
  });
});
