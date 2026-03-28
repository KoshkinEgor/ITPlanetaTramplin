import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  decideCompanyModeration,
  downloadModerationCompanyVerificationDocument,
  getModerationCompanies,
  getModerationCompany,
  updateModerationCompany,
} from "../api/moderation";
import { ModeratorCompaniesApp } from "./ModeratorCompaniesApp";

vi.mock("../api/moderation", () => ({
  decideCompanyModeration: vi.fn(),
  downloadModerationCompanyVerificationDocument: vi.fn(),
  getModerationCompanies: vi.fn(),
  getModerationCompany: vi.fn(),
  updateModerationCompany: vi.fn(),
}));

const verificationData = JSON.stringify({
  snapshot: {
    companyName: "Northwind",
    inn: "1234567890",
    legalAddress: "Moscow",
  },
  contact: {
    name: "Irina Smirnova",
    role: "HR Lead",
    phone: "+7 999 000-00-00",
    email: "hr@northwind.example",
  },
  document: {
    originalName: "egrul.pdf",
    contentType: "application/pdf",
    sizeBytes: 4096,
    storageKey: "company-12/egrul.pdf",
  },
  submittedAt: "2026-03-28T10:00:00.000Z",
});

const listItems = [
  {
    id: 12,
    companyName: "Northwind",
    email: "team@northwind.example",
    inn: "1234567890",
    legalAddress: "Moscow",
    description: "Security vendor",
    verificationStatus: "pending",
    createdAt: "2026-03-19T10:00:00.000Z",
  },
];

const detailItem = {
  ...listItems[0],
  socials: "https://northwind.example",
  verificationData,
  verificationMethod: "manual_document",
  opportunitiesCount: 3,
};

describe("ModeratorCompaniesApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getModerationCompanies.mockResolvedValue(listItems);
    getModerationCompany.mockResolvedValue(detailItem);
    updateModerationCompany.mockResolvedValue(undefined);
    decideCompanyModeration.mockResolvedValue(undefined);
    downloadModerationCompanyVerificationDocument.mockResolvedValue({
      blob: new Blob(["pdf"], { type: "application/pdf" }),
      fileName: "egrul.pdf",
    });

    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:document"),
      revokeObjectURL: vi.fn(),
    });

    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("loads company details and saves profile edits", async () => {
    render(<ModeratorCompaniesApp />);

    fireEvent.click(await screen.findByRole("button", { name: /Northwind/i }));

    const dialog = await screen.findByRole("dialog", { name: "Проверка компании" });

    expect(within(dialog).getByLabelText(/Название компании/i)).toHaveValue("Northwind");
    expect(screen.getByText("Irina Smirnova")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Скачать документ" })).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText(/Название компании/i), { target: { value: "Northwind Updated" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Сохранить профиль" }));

    await waitFor(() => {
      expect(updateModerationCompany).toHaveBeenCalledWith(
        12,
        expect.objectContaining({
          companyName: "Northwind Updated",
        })
      );
    });
  });

  it("applies verification decisions explicitly", async () => {
    render(<ModeratorCompaniesApp />);

    fireEvent.click(await screen.findByRole("button", { name: /Northwind/i }));

    const dialog = await screen.findByRole("dialog", { name: "Проверка компании" });

    expect(within(dialog).getByLabelText("Статус верификации")).toHaveValue("pending");

    fireEvent.change(within(dialog).getByLabelText("Статус верификации"), { target: { value: "approved" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Применить решение" }));

    await waitFor(() => {
      expect(decideCompanyModeration).toHaveBeenCalledWith(12, "approved");
    });
  });

  it("downloads verification documents from the moderator modal", async () => {
    const appendSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(HTMLElement.prototype, "remove");

    render(<ModeratorCompaniesApp />);

    fireEvent.click(await screen.findByRole("button", { name: /Northwind/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Скачать документ" }));

    await waitFor(() => {
      expect(downloadModerationCompanyVerificationDocument).toHaveBeenCalledWith(12);
    });

    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });
});
