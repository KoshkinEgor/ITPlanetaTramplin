import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  downloadCompanyVerificationDocument,
  getCompanyOpportunities,
  getCompanyProfile,
  submitCompanyVerificationRequest,
  updateCompanyProfile,
} from "../api/company";
import { CompanyProfileSection } from "./CompanyProfileSection";

vi.mock("../api/company", () => ({
  downloadCompanyVerificationDocument: vi.fn(),
  getCompanyOpportunities: vi.fn(),
  getCompanyProfile: vi.fn(),
  submitCompanyVerificationRequest: vi.fn(),
  updateCompanyProfile: vi.fn(),
}));

vi.mock("./CompanyHeroMediaPanel", () => ({
  CompanyHeroMediaPanel: () => <div>Hero media preview</div>,
}));

vi.mock("./CompanyGalleryPanel", () => ({
  CompanyGalleryPanel: () => <div>Gallery preview</div>,
}));

vi.mock("./CompanyPortfolioCarousel", () => ({
  CompanyPortfolioCarousel: () => <div>Portfolio preview</div>,
}));

const baseProfile = {
  profileId: 12,
  userId: 2,
  email: "team@northwind.example",
  companyName: "Northwind",
  inn: "1234567890",
  legalAddress: "Moscow",
  description: "Security vendor",
  socials: "[]",
  heroMediaJson: null,
  caseStudiesJson: "[]",
  galleryJson: "[]",
  verificationData: null,
  verificationMethod: null,
  verificationStatus: "pending",
};

function renderSection() {
  return render(
    <MemoryRouter>
      <CompanyProfileSection />
    </MemoryRouter>
  );
}

describe("CompanyProfileSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCompanyProfile.mockResolvedValue(baseProfile);
    getCompanyOpportunities.mockResolvedValue([]);
    updateCompanyProfile.mockResolvedValue(baseProfile);
    downloadCompanyVerificationDocument.mockResolvedValue({
      blob: new Blob(["pdf"], { type: "application/pdf" }),
      fileName: "egrul.pdf",
    });

    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:company-document"),
      revokeObjectURL: vi.fn(),
    });

    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("submits a multipart verification request from the company cabinet", async () => {
    submitCompanyVerificationRequest.mockResolvedValue({
      ...baseProfile,
      verificationMethod: "manual_document",
      verificationData: JSON.stringify({
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
      }),
      verificationStatus: "pending",
    });

    renderSection();

    fireEvent.click(await screen.findByRole("button", { name: "Пройти полную верификацию" }));

    const dialog = await screen.findByRole("dialog", { name: "Полная верификация компании" });

    const [contactNameInput, roleInput, phoneInput, emailInput] = within(dialog).getAllByRole("textbox");

    fireEvent.change(contactNameInput, { target: { value: "Irina Smirnova" } });
    fireEvent.change(roleInput, { target: { value: "HR Lead" } });
    fireEvent.change(phoneInput, { target: { value: "+7 999 000-00-00" } });
    fireEvent.change(emailInput, { target: { value: "hr@northwind.example" } });

    const fileInput = dialog.querySelector('input[type="file"]');
    const file = new File(["pdf"], "egrul.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(within(dialog).getByRole("button", { name: "Отправить модератору" }));

    await waitFor(() => {
      expect(submitCompanyVerificationRequest).toHaveBeenCalledTimes(1);
    });

    const formData = submitCompanyVerificationRequest.mock.calls[0][0];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("contactName")).toBe("Irina Smirnova");
    expect(formData.get("contactRole")).toBe("HR Lead");
    expect(formData.get("contactPhone")).toBe("+7 999 000-00-00");
    expect(formData.get("contactEmail")).toBe("hr@northwind.example");
    expect(formData.get("document")).toBeInstanceOf(File);

    expect(await screen.findByText(/Заявка отправлена модератору/i)).toBeInTheDocument();
  });

  it("keeps the verification input focused while typing", async () => {
    renderSection();

    fireEvent.click(await screen.findByRole("button", { name: "Пройти полную верификацию" }));

    const dialog = await screen.findByRole("dialog", { name: "Полная верификация компании" });
    const [contactNameInput] = within(dialog).getAllByRole("textbox");

    contactNameInput.focus();
    expect(contactNameInput).toHaveFocus();

    fireEvent.change(contactNameInput, { target: { value: "И" } });
    expect(contactNameInput).toHaveValue("И");
    expect(contactNameInput).toHaveFocus();

    fireEvent.change(contactNameInput, { target: { value: "Ир" } });
    expect(contactNameInput).toHaveValue("Ир");
    expect(contactNameInput).toHaveFocus();
  });

  it("shows a backend update hint when the verification endpoint returns 404", async () => {
    submitCompanyVerificationRequest.mockRejectedValue(
      Object.assign(new Error("Request failed with status 404"), { status: 404 })
    );

    renderSection();

    fireEvent.click(await screen.findByRole("button", { name: "Пройти полную верификацию" }));

    const dialog = await screen.findByRole("dialog", { name: "Полная верификация компании" });
    const [contactNameInput, roleInput, phoneInput, emailInput] = within(dialog).getAllByRole("textbox");

    fireEvent.change(contactNameInput, { target: { value: "Irina Smirnova" } });
    fireEvent.change(roleInput, { target: { value: "HR Lead" } });
    fireEvent.change(phoneInput, { target: { value: "+7 999 000-00-00" } });
    fireEvent.change(emailInput, { target: { value: "hr@northwind.example" } });

    const fileInput = dialog.querySelector('input[type="file"]');
    const file = new File(["pdf"], "egrul.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(within(dialog).getByRole("button", { name: "Отправить модератору" }));

    expect(await screen.findByText(/Перезапустите backend или обновите API/i)).toBeInTheDocument();
  });

  it("renders read-only pending verification details and allows document download", async () => {
    getCompanyProfile.mockResolvedValue({
      ...baseProfile,
      verificationMethod: "manual_document",
      verificationData: JSON.stringify({
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
      }),
    });

    const appendSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(HTMLElement.prototype, "remove");

    renderSection();

    expect(await screen.findByText("Irina Smirnova")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Пройти полную верификацию" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Скачать документ" }));

    await waitFor(() => {
      expect(downloadCompanyVerificationDocument).toHaveBeenCalledTimes(1);
    });

    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });
});
