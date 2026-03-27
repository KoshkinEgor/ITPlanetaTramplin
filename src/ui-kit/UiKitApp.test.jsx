import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UiKitApp } from "./UiKitApp";

describe("UiKitApp", () => {
  it("renders the consolidated ui kit and cleans up the body class", () => {
    const { unmount } = render(<UiKitApp />);

    expect(document.body).toHaveClass("ui-kit-react-body");
    expect(screen.getByTestId("ui-kit-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "UI Kit Playground" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Foundation" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Colors" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Typography" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Font" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Spacing" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Radii" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Shadows" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Surfaces" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Buttons" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: "Actions" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: "Complaint Card" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: "Form Controls" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: "Navigation" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: "FormField" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: "Placeholders" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: "Career" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: "Assemblies" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Editable resume snippets" })).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-placeholder-block")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-placeholder-action")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-placeholder-media")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-editable-summary")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-settings-section")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-dashboard-assembly")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-search-preview-elevated")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-pill-preview-lg")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-complaint-cards")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-opportunity-row")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-content-rail")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-opportunity-slider-uniform")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-opportunity-slider-featured")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-opportunity-slider-raised")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-opportunity-detail-preview")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-company-tile")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-filter-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-career-stats-panel")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-career-course-card")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-career-peer-card")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-career-assembly")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Career dashboard assembly" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Moderator dashboard surfaces" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Дашборд модерации" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Confirm Action Select" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Moderation Action Dialog" })).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-moderation-action-dialogs")).toBeInTheDocument();

    unmount();

    expect(document.body).not.toHaveClass("ui-kit-react-body");
  });

  it("updates local button preview state without changing shared component APIs", () => {
    render(<UiKitApp />);

    const buttonCard = screen.getByTestId("ui-kit-button-preview").closest(".ui-kit-specimen");

    expect(buttonCard).not.toBeNull();

    const buttonScope = within(buttonCard);

    fireEvent.change(buttonScope.getByLabelText("Variant"), { target: { value: "danger" } });
    fireEvent.click(buttonScope.getByLabelText("Loading"));

    expect(screen.getByTestId("ui-kit-button-preview")).toHaveClass("ui-button--danger");
    expect(screen.getByTestId("ui-kit-button-preview")).toHaveClass("is-loading");
  });

  it("updates the search preview appearance and size inside the ui kit", () => {
    render(<UiKitApp />);

    const searchCard = screen.getByTestId("ui-kit-search-preview").closest(".ui-kit-specimen");

    expect(searchCard).not.toBeNull();

    const searchScope = within(searchCard);

    fireEvent.change(searchScope.getByLabelText("Appearance"), { target: { value: "elevated" } });
    fireEvent.change(searchScope.getByLabelText("Size"), { target: { value: "lg" } });

    const shell = screen.getByTestId("ui-kit-search-preview").closest(".ui-search-input");

    expect(shell).toHaveClass("ui-search-input--elevated");
    expect(shell).toHaveClass("ui-search-input--lg");
  });

  it("supports the contrast button variant with a configurable accent color", () => {
    render(<UiKitApp />);

    const buttonCard = screen.getByTestId("ui-kit-button-preview").closest(".ui-kit-specimen");

    expect(buttonCard).not.toBeNull();

    const buttonScope = within(buttonCard);

    fireEvent.change(buttonScope.getByLabelText("Variant"), { target: { value: "contrast" } });
    fireEvent.change(buttonScope.getByLabelText("Accent color"), { target: { value: "#3ddc72" } });

    expect(screen.getByTestId("ui-kit-button-preview")).toHaveClass("ui-button--contrast");
    expect(screen.getByTestId("ui-kit-button-preview")).toHaveStyle("--ui-button-accent: #3ddc72");
  });

  it("updates the action select preview state inside the ui kit", () => {
    render(<UiKitApp />);

    const actionSelectPreview = screen.getByTestId("ui-kit-action-select-preview");
    const actionSelectScope = within(actionSelectPreview);

    fireEvent.click(actionSelectScope.getByRole("button", { name: "Заблокировать" }));
    const deleteOption = screen
      .getAllByRole("option", { name: "Удалить" })
      .find((element) => element.tagName === "BUTTON");
    expect(deleteOption).toBeTruthy();
    fireEvent.click(deleteOption);

    expect(actionSelectScope.getByRole("button", { name: "Удалить" })).toHaveClass("ui-action-select--danger");
  });

  it("confirms the selected action inside the ui kit preview", () => {
    render(<UiKitApp />);

    const confirmPreview = screen.getByTestId("ui-kit-confirm-action-select-preview");
    const confirmScope = within(confirmPreview);

    fireEvent.click(confirmScope.getByRole("button", { name: "Одобрить" }));
    const rejectOption = screen
      .getAllByRole("option", { name: "Отклонить" })
      .find((element) => element.tagName === "BUTTON");

    expect(rejectOption).toBeTruthy();
    fireEvent.click(rejectOption);

    const dialog = screen.getByRole("dialog");

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "Подтвердить: Отклонить?" })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Отклонить" }));

    expect(confirmScope.getByRole("button", { name: "Отклонить" })).toHaveClass("ui-action-select--reject");
  });

  it("updates the segmented control preview state inside the ui kit", () => {
    render(<UiKitApp />);

    const segmentedPreview = screen.getByTestId("ui-kit-segmented-preview");
    const segmentedScope = within(segmentedPreview);

    fireEvent.click(segmentedScope.getByRole("button", { name: "Резюме" }));

    expect(segmentedScope.getByRole("button", { name: "Резюме" })).toHaveClass("is-active");
    expect(segmentedScope.getByRole("button", { name: "Портфолио" })).not.toHaveClass("is-active");
  });
  it("shows the full typography catalog and keeps the segmented preview at md by default", () => {
    render(<UiKitApp />);

    expect(screen.getByText(".ui-type-display")).toBeInTheDocument();
    expect(screen.getByText(".ui-type-overline")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-segmented-preview")).not.toHaveClass("ui-segmented--size-lg");
  });

  it("renders editable resume cards with distinct default, active, and compact states", () => {
    render(<UiKitApp />);

    expect(screen.getByTestId("ui-kit-editable-card-default")).not.toHaveClass("is-active");
    expect(screen.getByTestId("ui-kit-editable-card-active")).toHaveClass("is-active");
    expect(screen.getByTestId("ui-kit-editable-card-compact")).toHaveClass("is-compact");
    expect(screen.getByText("О себе")).toBeInTheDocument();
    expect(screen.getAllByText("ЧГУ им. И. Н. Ульянова")).toHaveLength(2);
  });

  it("shows the input variants gallery with default, left-icon, and right-icon layouts", () => {
    render(<UiKitApp />);

    const variants = screen.getByTestId("ui-kit-input-variants");
    const variantsScope = within(variants);

    expect(variantsScope.getByText("Default")).toBeInTheDocument();
    expect(variantsScope.getByText("Icon left")).toBeInTheDocument();
    expect(variantsScope.getByText("Icon right")).toBeInTheDocument();
    expect(variantsScope.getByDisplayValue("IT - Планета")).toBeInTheDocument();
    expect(variantsScope.getAllByText("Сбросить")).toHaveLength(3);
  });

  it("updates the moderation revision reason inside the ui kit showcase", () => {
    render(<UiKitApp />);

    fireEvent.change(screen.getByLabelText("Текст причины"), { target: { value: "Нужно уточнить программу мероприятия" } });

    const moderationDialogs = within(screen.getByTestId("ui-kit-moderation-action-dialogs"));

    expect(moderationDialogs.getByLabelText("Причина отказа")).toHaveValue("Нужно уточнить программу мероприятия");
  });

  it("switches the complaint card preview to md size", () => {
    render(<UiKitApp />);

    fireEvent.change(screen.getByLabelText("Размер"), { target: { value: "md" } });

    expect(screen.getByTestId("ui-kit-complaint-card-preview")).toHaveClass("ui-complaint-card--md");
  });
});
