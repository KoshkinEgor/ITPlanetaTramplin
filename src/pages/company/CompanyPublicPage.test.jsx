import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublicCompany, getPublicCompanyOpportunities } from "../../api/company";
import { ApiError } from "../../lib/http";
import { CompanyPublicPage } from "./CompanyPublicPage";

vi.mock("../../api/company", () => ({
  getPublicCompany: vi.fn(),
  getPublicCompanyOpportunities: vi.fn(),
}));

vi.mock("../../widgets/layout", () => ({
  PortalHeader: () => <div data-testid="portal-header" />,
}));

const companyProfile = {
  profileId: 101,
  companyName: "Northwind",
  inn: "7701234567",
  legalAddress: "Москва, Лесная 10",
  description: "Продуктовая компания с сильной инженерной командой.",
  socials: '[{"type":"website","url":"northwind.dev"}]',
  verificationStatus: "approved",
  heroMediaJson:
    '{"type":"image","title":"Hero title","description":"Hero description","previewUrl":"https://example.com/hero.jpg","sourceUrl":"https://example.com/about"}',
  caseStudiesJson:
    '[{"id":"case-1","title":"Case title","subtitle":"Platform relaunch","description":"Case description","mediaType":"image","previewUrl":"https://example.com/case.jpg","sourceUrl":"https://example.com/case"}]',
  galleryJson:
    '[{"id":"gallery-1","alt":"Team photo","imageUrl":"https://example.com/team.jpg"}]',
};

const companyOpportunities = [
  {
    id: 12,
    employerId: 101,
    title: "DevRel internship",
    companyName: "Northwind",
    locationCity: "Москва",
    employmentType: "hybrid",
    opportunityType: "internship",
    description: "Работа с комьюнити и контентом.",
    tags: ["Community", "Content"],
    isPaid: false,
    duration: "3 месяца",
  },
];

function renderPage(path = "/companies/101") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/companies/:id" element={<CompanyPublicPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("CompanyPublicPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPublicCompany.mockResolvedValue(companyProfile);
    getPublicCompanyOpportunities.mockResolvedValue(companyOpportunities);
  });

  it("renders public company sections in viewer mode with typed opportunity facts", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Northwind" })).toBeInTheDocument();
    expect(screen.getByText("Hero title")).toBeInTheDocument();
    expect(screen.getByText("Case title")).toBeInTheDocument();
    expect(screen.getByText("Team photo")).toBeInTheDocument();
    expect(screen.getByText("DevRel internship")).toBeInTheDocument();
    expect(screen.getByText("Оплата")).toBeInTheDocument();
    expect(screen.getByText("Без оплаты")).toBeInTheDocument();
    expect(screen.getByText("Длительность: 3 месяца")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Перейти к редактированию" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Добавить проект" })).not.toBeInTheDocument();
  });

  it("shows the not found state for an unavailable company", async () => {
    getPublicCompany.mockRejectedValue(new ApiError("Not found", { status: 404 }));
    getPublicCompanyOpportunities.mockRejectedValue(new ApiError("Not found", { status: 404 }));

    renderPage("/companies/999");

    expect(await screen.findByText("Публичная страница недоступна")).toBeInTheDocument();
  });
});
