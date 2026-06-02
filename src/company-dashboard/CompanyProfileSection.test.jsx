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
import { refreshAuthSession } from "../auth/api";
import { uploadImage } from "../api/uploads";
import { CompanyProfileSection } from "./CompanyProfileSection";

vi.mock("../api/company", () => ({
  downloadCompanyVerificationDocument: vi.fn(),
  getCompanyOpportunities: vi.fn(),
  getCompanyProfile: vi.fn(),
  submitCompanyVerificationRequest: vi.fn(),
  updateCompanyProfile: vi.fn(),
}));

vi.mock("../api/uploads", () => ({
  uploadImage: vi.fn(),
}));

vi.mock("../auth/api", () => ({
  refreshAuthSession: vi.fn(() => Promise.resolve({})),
}));

vi.mock("./CompanyHeroMediaPanel", () => ({
  CompanyHeroMediaPanel: () => <div>Hero media preview</div>,
}));

vi.mock("./CompanyGalleryPanel", () => ({
  CompanyGalleryPanel: () => <div>Gallery preview</div>,
}));

vi.mock("./CompanyPortfolioCarousel", () => ({
  CompanyPortfolioCarousel: ({
    items = [],
    mode,
    showOwnerActions,
    showCreateAction,
    onCtaClick,
    onEditItem,
    onDeleteItem,
    testId = "company-profile-portfolio-slider",
  }) => (
    <div data-testid={testId} data-mode={mode}>
      <div>Portfolio preview</div>
      {items.map((item) => (
        <article key={item.id}>
          <h3>{item.title || item.description}</h3>
          {showOwnerActions ? (
            <>
              <button type="button" aria-label={`Редактировать проект: ${item.title || item.description}`} onClick={() => onEditItem?.(item)}>
                edit
              </button>
              <button type="button" aria-label={`Удалить проект: ${item.title || item.description}`} onClick={() => onDeleteItem?.(item)}>
                delete
              </button>
            </>
          ) : null}
        </article>
      ))}
      {showCreateAction !== false && mode === "editor" ? (
        <button type="button" onClick={onCtaClick}>
          Добавить проект
        </button>
      ) : null}
    </div>
  ),
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

const profileWithProjects = {
  ...baseProfile,
  caseStudiesJson: JSON.stringify([
    {
      id: "case-1",
      title: "Analytics Hub",
      description: "Analytics Hub",
      mediaType: "image",
      previewUrl: "https://cdn.example.com/analytics.png",
      sourceUrl: "https://example.com/analytics",
    },
  ]),
  galleryJson: JSON.stringify([
    {
      id: "gallery-1",
      alt: "Office",
      imageUrl: "https://cdn.example.com/office.png",
    },
  ]),
};

function renderSection(initialEntries = ["/company/dashboard"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
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
    uploadImage.mockResolvedValue({ url: "https://cdn.example.com/company-photo.png" });
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

  it("shows preview mode for company info until the user opens editing", async () => {
    renderSection();

    expect(await screen.findByText("Northwind")).toBeInTheDocument();
    expect(screen.queryByLabelText("Название компании")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));

    expect(await screen.findByDisplayValue("Northwind")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Moscow")).toBeInTheDocument();
  });

  it("shows project edit and delete actions only in the company cabinet portfolio", async () => {
    getCompanyProfile.mockResolvedValue(profileWithProjects);

    renderSection();

    expect(await screen.findByRole("button", { name: "Редактировать проект: Analytics Hub" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Удалить проект: Analytics Hub" })).toBeInTheDocument();
  });

  it("edits an existing company project instead of adding a duplicate", async () => {
    getCompanyProfile.mockResolvedValue(profileWithProjects);
    updateCompanyProfile.mockResolvedValue({
      ...profileWithProjects,
      caseStudiesJson: JSON.stringify([
        {
          id: "case-1",
          title: "Updated Analytics",
          description: "Updated Analytics",
          mediaType: "image",
          previewUrl: "https://cdn.example.com/analytics.png",
          sourceUrl: "https://example.com/updated",
        },
      ]),
    });

    renderSection();

    fireEvent.click(await screen.findByRole("button", { name: "Редактировать проект: Analytics Hub" }));

    const descriptionInput = await screen.findByDisplayValue("Analytics Hub");
    fireEvent.change(descriptionInput, { target: { value: "Updated Analytics" } });
    fireEvent.change(screen.getByDisplayValue("https://example.com/analytics"), {
      target: { value: "https://example.com/updated" },
    });
    fireEvent.submit(descriptionInput.closest("form"));

    fireEvent.click(screen.getByRole("button", { name: /РЎРѕС…СЂР°РЅРёС‚СЊ РєРѕРЅС‚РµРЅС‚|Сохранить контент/i }));

    await waitFor(() => {
      expect(updateCompanyProfile).toHaveBeenLastCalledWith(expect.objectContaining({
        caseStudiesJson: expect.any(String),
      }));
    });

    const payload = JSON.parse(updateCompanyProfile.mock.calls.at(-1)[0].caseStudiesJson);
    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({
      id: "case-1",
      title: "Updated Analytics",
      description: "Updated Analytics",
      sourceUrl: "https://example.com/updated",
    });
  });

  it("deletes a company project from the draft and persists it with the profile", async () => {
    getCompanyProfile.mockResolvedValue(profileWithProjects);
    updateCompanyProfile.mockResolvedValue({ ...profileWithProjects, caseStudiesJson: "[]" });

    renderSection();

    fireEvent.click(await screen.findByRole("button", { name: "Удалить проект: Analytics Hub" }));
    fireEvent.click(screen.getByRole("button", { name: /РЎРѕС…СЂР°РЅРёС‚СЊ РєРѕРЅС‚РµРЅС‚|Сохранить контент/i }));

    await waitFor(() => {
      expect(updateCompanyProfile).toHaveBeenLastCalledWith(expect.objectContaining({
        caseStudiesJson: "[]",
      }));
    });
  });

  it("opens draft public preview without project owner controls", async () => {
    getCompanyProfile.mockResolvedValue(profileWithProjects);

    renderSection();

    fireEvent.click(await screen.findByRole("button", { name: "Предпросмотр публичной версии" }));

    const preview = await screen.findByTestId("company-public-draft-preview");
    expect(within(preview).getAllByText("Northwind").length).toBeGreaterThan(0);
    expect(within(preview).getByText("Analytics Hub")).toBeInTheDocument();
    expect(within(preview).queryByRole("button", { name: /Редактировать проект/i })).not.toBeInTheDocument();
    expect(within(preview).queryByRole("button", { name: /Удалить проект/i })).not.toBeInTheDocument();
    expect(within(preview).queryByRole("button", { name: "Добавить проект" })).not.toBeInTheDocument();
  });

  it("opens the basic company editor from the cabinet edit hash", async () => {
    renderSection(["/company/dashboard#company-profile-editor"]);

    expect(await screen.findByDisplayValue("Northwind")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Moscow")).toBeInTheDocument();
  });

  it("uploads and saves the company photo from the basic profile editor", async () => {
    updateCompanyProfile.mockResolvedValue({
      ...baseProfile,
      profileImage: "https://cdn.example.com/company-photo.png",
    });

    renderSection();

    fireEvent.click(await screen.findByRole("button", { name: "Редактировать" }));

    const file = new File(["image"], "company-photo.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Загрузить фото компании"), { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadImage).toHaveBeenCalledWith(expect.objectContaining({ name: "company-photo.png" }));
    });

    expect(await screen.findByRole("img", { name: "Фото компании" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/company-photo.png"
    );

    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => {
      expect(updateCompanyProfile).toHaveBeenCalledWith(expect.objectContaining({
        profileImage: "https://cdn.example.com/company-photo.png",
      }));
    });

    expect(refreshAuthSession).toHaveBeenCalledWith({ force: true });
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

    fireEvent.click(await screen.findByRole("button", { name: "Отправить документы" }));

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

    fireEvent.click(await screen.findByRole("button", { name: "Отправить документы" }));

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

  it("shows a temporary unavailable hint when verification submit returns 404", async () => {
    submitCompanyVerificationRequest.mockRejectedValue(
      Object.assign(new Error("Request failed with status 404"), { status: 404 })
    );

    renderSection();

    fireEvent.click(await screen.findByRole("button", { name: "Отправить документы" }));

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

    expect(await screen.findByText(/Отправка заявки временно недоступна/i)).toBeInTheDocument();
  });

  it("renders read-only pending verification details and allows document download", async () => {
    getCompanyProfile.mockResolvedValue({
      ...baseProfile,
      verificationMethod: "manual_document",
      verificationData: JSON.stringify({
        Snapshot: {
          CompanyName: "Northwind",
          Inn: "1234567890",
          LegalAddress: "Moscow",
        },
        Contact: {
          Name: "Irina Smirnova",
          Role: "HR Lead",
          Phone: "+7 999 000-00-00",
          Email: "hr@northwind.example",
        },
        Document: {
          OriginalName: "egrul.pdf",
          ContentType: "application/pdf",
          SizeBytes: 4096,
          StorageKey: "company-12/egrul.pdf",
        },
        SubmittedAt: "2026-03-28T10:00:00.000Z",
      }),
    });

    const appendSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(HTMLElement.prototype, "remove");

    renderSection();

    expect(await screen.findByText("Irina Smirnova")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Отправить документы" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));

    expect(await screen.findByDisplayValue("Northwind")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Moscow")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Скачать" }));

    await waitFor(() => {
      expect(downloadCompanyVerificationDocument).toHaveBeenCalledTimes(1);
    });

    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });

  it("hides raw legacy verification payloads for pending companies", async () => {
    getCompanyProfile.mockResolvedValue({
      ...baseProfile,
      verificationStatus: "pending",
      verificationData: JSON.stringify({
        source: "development-seed",
      }),
    });

    renderSection();

    expect(await screen.findByText("Northwind")).toBeInTheDocument();
    expect(screen.queryByText("РђСЂС…РёРІ")).not.toBeInTheDocument();
    expect(screen.queryByText('{"source":"development-seed"}')).not.toBeInTheDocument();
  });

  it("hides legacy verification payloads for approved companies", async () => {
    getCompanyProfile.mockResolvedValue({
      ...baseProfile,
      verificationStatus: "approved",
      verificationData: JSON.stringify({
        source: "development-seed",
      }),
    });

    renderSection();

    expect(await screen.findByText("Запись подтверждена")).toBeInTheDocument();
    expect(screen.queryByText("Архив")).not.toBeInTheDocument();
    expect(screen.queryByText('{"source":"development-seed"}')).not.toBeInTheDocument();
  });
});
