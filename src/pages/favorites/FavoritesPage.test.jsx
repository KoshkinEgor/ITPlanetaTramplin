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

  it("renders separate sections for favorite opportunities and companies", async () => {
    writeFavoriteOpportunityIds(["1"]);
    writeFavoriteCompanyIds(["10"]);

    renderPage();

    expect(await screen.findByRole("heading", { name: "Избранные возможности" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Избранные компании" })).toBeInTheDocument();
    expect(screen.getByText("Northwind")).toBeInTheDocument();
    expect(screen.getByText("Northwind").closest("a")).toHaveAttribute("href", "/companies/10");
    expect(screen.getByText("Менторская программа")).toBeInTheDocument();
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
