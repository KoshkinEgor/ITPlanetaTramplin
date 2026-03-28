import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCompanyOpportunities } from "../api/company";
import { createOpportunity, deleteOpportunity, getOpportunity, updateOpportunity } from "../api/opportunities";
import { CompanyOpportunitiesSection } from "./CompanyOpportunitiesSection";

vi.mock("../api/company", () => ({
  getCompanyOpportunities: vi.fn(),
}));

vi.mock("../api/opportunities", () => ({
  createOpportunity: vi.fn(),
  deleteOpportunity: vi.fn(),
  getOpportunity: vi.fn(),
  updateOpportunity: vi.fn(),
}));

vi.mock("./OpportunityLocationPicker", () => ({
  OpportunityLocationPicker: () => <div data-testid="opportunity-location-picker" />,
}));

const baseOpportunity = {
  id: 15,
  title: "Backend internship",
  description: "Build APIs for candidate services.",
  locationCity: "Москва",
  locationAddress: "Лесная, 10",
  opportunityType: "internship",
  employmentType: "hybrid",
  moderationStatus: "approved",
  applicationsCount: 3,
  expireAt: "2026-05-10",
  contactsJson: null,
  mediaContentJson: null,
  tags: ["API", "C#"],
};

function renderSection() {
  return render(
    <MemoryRouter>
      <CompanyOpportunitiesSection />
    </MemoryRouter>
  );
}

describe("CompanyOpportunitiesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCompanyOpportunities.mockResolvedValue([baseOpportunity]);
    getOpportunity.mockResolvedValue(baseOpportunity);
    createOpportunity.mockResolvedValue({ id: baseOpportunity.id });
    updateOpportunity.mockResolvedValue({});
    deleteOpportunity.mockResolvedValue({});
  });

  it("keeps the editor hidden until the user opens the create form", async () => {
    renderSection();

    expect(await screen.findByText("Backend internship")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Название" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Создать возможность" }));

    expect(await screen.findByRole("textbox", { name: "Название" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отмена" })).toBeInTheDocument();
  });

  it("shows a detail-page link on the card and opens the edit form from the card action", async () => {
    renderSection();

    expect(await screen.findByText("Backend internship")).toBeInTheDocument();

    const detailLink = screen.getByRole("link", { name: "Перейти на страницу возможности" });
    expect(detailLink).toHaveAttribute("href", "/opportunities/15");

    fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));

    await waitFor(() => {
      expect(getOpportunity).toHaveBeenCalledWith(15);
    });

    expect(await screen.findByDisplayValue("Backend internship")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сохранить публикацию" })).toBeInTheDocument();
  });
});
