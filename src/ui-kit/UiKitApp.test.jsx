import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UiKitApp } from "./UiKitApp";

const TEXT = {
  resume: /Резюме/i,
  portfolio: /Портфолио/i,
  moderatorDashboard: /Дашборд модерации/i,
  block: /Заблокировать/i,
  remove: /Удалить/i,
  approve: /Одобрить/i,
  reject: /Отклонить/i,
  confirmReject: /Подтвердить:\s*Отклонить\?/i,
  about: /О себе/i,
  university: /ЧГУ им\. И\. Н\. Ульянова/i,
  itPlanet: /IT - Планета/i,
  reset: /Сбросить/i,
  next: /Дальше/i,
  previous: /Назад/i,
  reasonText: /Текст причины/i,
  rejectionReason: /Причина отказа/i,
  size: /Размер/i,
};

function createRect(left, top, width, height) {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON() {
      return this;
    },
  };
}

function buildBounds(location) {
  const [longitude, latitude] = location.center;
  const span = 24 / Math.max(location.zoom ?? 10, 1);

  return [
    [longitude - span, latitude - span],
    [longitude + span, latitude + span],
  ];
}

const uiKitMapUpdateCalls = [];

class MockUiKitYMap {
  constructor(container, props) {
    this.container = container;
    this.listener = null;
    this.location = {
      ...props.location,
      bounds: buildBounds(props.location),
    };
  }

  addChild(child) {
    if (child.kind === "listener") {
      this.listener = child.props.onUpdate;
      this.emit();
      return;
    }

    if (child.kind === "clusterer") {
      const clusteredFeatures = new Map();
      const clusteredIds = new Set();

      child.props.features.forEach((feature) => {
        const clusterGroup = feature.properties?.point?.clusterGroup;

        if (!clusterGroup) {
          return;
        }

        const items = clusteredFeatures.get(clusterGroup) ?? [];
        items.push(feature);
        clusteredFeatures.set(clusterGroup, items);
      });

      clusteredFeatures.forEach((features) => {
        if (features.length === 1) {
          const marker = child.props.marker(features[0]);
          this.container.appendChild(marker.element);
          clusteredIds.add(String(features[0].id));
          return;
        }

        const coordinates = features.reduce(
          (accumulator, feature) => [
            accumulator[0] + feature.geometry.coordinates[0],
            accumulator[1] + feature.geometry.coordinates[1],
          ],
          [0, 0]
        ).map((value) => value / features.length);
        const cluster = child.props.cluster(coordinates, features);
        this.container.appendChild(cluster.element);
        features.forEach((feature) => clusteredIds.add(String(feature.id)));
      });

      child.props.features.forEach((feature) => {
        if (clusteredIds.has(String(feature.id))) {
          return;
        }

        const marker = child.props.marker(feature);
        this.container.appendChild(marker.element);
      });

      this.emit();
    }
  }

  emit() {
    this.listener?.({ location: this.location });
  }

  update(nextProps) {
    uiKitMapUpdateCalls.push(nextProps.location);
    this.location = {
      ...this.location,
      ...nextProps.location,
      bounds: buildBounds({
        center: nextProps.location.center ?? this.location.center,
        zoom: nextProps.location.zoom ?? this.location.zoom,
      }),
    };
    this.emit();
  }

  destroy() {
    this.container.innerHTML = "";
  }
}

class MockUiKitYMapListener {
  constructor(props) {
    this.kind = "listener";
    this.props = props;
  }
}

class MockUiKitYMapClusterer {
  constructor(props) {
    this.kind = "clusterer";
    this.props = props;
  }
}

class MockUiKitYMapMarker {
  constructor(config, element) {
    this.config = config;
    this.element = element;
  }
}

const uiKitYmaps3Mock = {
  ready: Promise.resolve(),
  import: Object.assign(
    vi.fn(async () => ({
      YMapClusterer: MockUiKitYMapClusterer,
      clusterByGrid: vi.fn(() => "cluster"),
    })),
    { registerCdn: vi.fn() }
  ),
  YMap: MockUiKitYMap,
  YMapDefaultSchemeLayer: class {},
  YMapFeatureDataSource: class {},
  YMapLayer: class {},
  YMapListener: MockUiKitYMapListener,
  YMapMarker: MockUiKitYMapMarker,
};

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
    expect(screen.getAllByRole("heading", { name: "Resume & Portfolio" }).length).toBeGreaterThan(0);
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
    expect(screen.getByTestId("ui-kit-recommended-opportunities-assembly")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-recommended-opportunities-rail")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-map-live-preview")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-opportunity-detail-preview")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-company-portfolio-assembly")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-company-portfolio-viewer-assembly")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-company-tile")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-filter-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-career-stats-panel")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-career-course-card")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-career-peer-card")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-career-assembly")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-candidate-switcher")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-candidate-resume-profile")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-candidate-resume-mini-card")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-candidate-resume-section")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-candidate-project-card")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-candidate-resume-assembly")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-candidate-portfolio-assembly")).toBeInTheDocument();
    expect(within(screen.getByTestId("ui-kit-candidate-switcher")).getByRole("link", { name: TEXT.resume })).toBeInTheDocument();
    expect(within(screen.getByTestId("ui-kit-candidate-switcher")).getByRole("link", { name: TEXT.portfolio })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Career dashboard assembly" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resume page assembly" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Portfolio page assembly" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Company portfolio carousel" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Company portfolio carousel, viewer mode" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recommended opportunities rail" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Moderator dashboard surfaces" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: TEXT.moderatorDashboard })).toBeInTheDocument();
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

  it("shows the interactive mini-map specimen with cluster zoom and compact marker preview", async () => {
    const originalResizeObserver = global.ResizeObserver;
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    const originalApiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;

    import.meta.env.VITE_YANDEX_MAPS_API_KEY = "test-key";
    global.ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
    global.window.ymaps3 = uiKitYmaps3Mock;
    uiKitMapUpdateCalls.length = 0;

    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (this.classList?.contains("home-yandex-map")) {
        return createRect(0, 0, 420, 320);
      }

      if (this.classList?.contains("home-yandex-map__preview-card")) {
        return createRect(0, 0, 248, 116);
      }

      if (this.classList?.contains("home-yandex-map__canvas")) {
        return createRect(0, 0, 420, 320);
      }

      if (this.dataset?.pointId === "ui-map-4") {
        return createRect(264, 186, 24, 32);
      }

      return createRect(0, 0, 0, 0);
    };

    try {
      render(<UiKitApp />);

      const mapPreview = screen.getByTestId("ui-kit-map-live-preview");

      const cluster = await within(mapPreview).findByRole("button", { name: /3/ });
      fireEvent.click(cluster);

      await waitFor(() => expect(uiKitMapUpdateCalls.length).toBeGreaterThan(0));
      expect(uiKitMapUpdateCalls.some((location) => location.zoom === 12.2)).toBe(true);

      const marker = await within(mapPreview).findByLabelText("Career Meetup Volga");
      fireEvent.click(marker);

      await waitFor(() => expect(document.querySelector(".home-yandex-map__preview-card")).not.toBeNull());
      const previewCard = document.querySelector(".home-yandex-map__preview-card");
      expect(previewCard).toHaveClass("ui-opportunity-mini-card--map-compact");
      expect(within(mapPreview).getByRole("link")).toBeInTheDocument();
      expect(uiKitMapUpdateCalls.some((location) => location.zoom >= 16.5)).toBe(true);
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
      global.ResizeObserver = originalResizeObserver;
      import.meta.env.VITE_YANDEX_MAPS_API_KEY = originalApiKey;
      delete global.window.ymaps3;
    }
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

    fireEvent.click(actionSelectScope.getByRole("button", { name: TEXT.block }));
    const deleteOption = screen
      .getAllByRole("option", { name: TEXT.remove })
      .find((element) => element.tagName === "BUTTON");
    expect(deleteOption).toBeTruthy();
    fireEvent.click(deleteOption);

    expect(actionSelectScope.getByRole("button", { name: TEXT.remove })).toHaveClass("ui-action-select--danger");
  });

  it("confirms the selected action inside the ui kit preview", () => {
    render(<UiKitApp />);

    const confirmPreview = screen.getByTestId("ui-kit-confirm-action-select-preview");
    const confirmScope = within(confirmPreview);

    fireEvent.click(confirmScope.getByRole("button", { name: TEXT.approve }));
    const rejectOption = screen
      .getAllByRole("option", { name: TEXT.reject })
      .find((element) => element.tagName === "BUTTON");

    expect(rejectOption).toBeTruthy();
    fireEvent.click(rejectOption);

    const dialog = screen.getByRole("dialog");

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: TEXT.confirmReject })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: TEXT.reject }));

    expect(confirmScope.getByRole("button", { name: TEXT.reject })).toHaveClass("ui-action-select--reject");
  });

  it("updates the segmented control preview state inside the ui kit", () => {
    render(<UiKitApp />);

    const segmentedPreview = screen.getByTestId("ui-kit-segmented-preview");
    const segmentedScope = within(segmentedPreview);

    fireEvent.click(segmentedScope.getByRole("button", { name: TEXT.resume }));

    expect(segmentedScope.getByRole("button", { name: TEXT.resume })).toHaveClass("is-active");
    expect(segmentedScope.getByRole("button", { name: TEXT.portfolio })).not.toHaveClass("is-active");
  });
  it("shows the full typography catalog and keeps the segmented preview at md by default", () => {
    render(<UiKitApp />);

    expect(screen.getByText(".ui-type-display")).toBeInTheDocument();
    expect(screen.getByText(".ui-type-overline")).toBeInTheDocument();
    expect(screen.getByTestId("ui-kit-segmented-preview")).not.toHaveClass("ui-segmented--size-lg");
  });

  it("renders editable resume cards with distinct default, active, and compact states", () => {
    render(<UiKitApp />);

    const editableSummary = screen.getByTestId("ui-kit-editable-summary");
    const editableScope = within(editableSummary);

    expect(screen.getByTestId("ui-kit-editable-card-default")).not.toHaveClass("is-active");
    expect(screen.getByTestId("ui-kit-editable-card-active")).toHaveClass("is-active");
    expect(screen.getByTestId("ui-kit-editable-card-compact")).toHaveClass("is-compact");
    expect(editableScope.getByText(TEXT.about)).toBeInTheDocument();
    expect(editableScope.getAllByText(TEXT.university)).toHaveLength(2);
  });

  it("shows the input variants gallery with default, left-icon, and right-icon layouts", () => {
    render(<UiKitApp />);

    const variants = screen.getByTestId("ui-kit-input-variants");
    const variantsScope = within(variants);

    expect(variantsScope.getByText("Default")).toBeInTheDocument();
    expect(variantsScope.getByText("Icon left")).toBeInTheDocument();
    expect(variantsScope.getByText("Icon right")).toBeInTheDocument();
    expect(variantsScope.getByDisplayValue(TEXT.itPlanet)).toBeInTheDocument();
    expect(variantsScope.getAllByText(TEXT.reset)).toHaveLength(3);
  });

  it("slides the company portfolio carousel inside the ui kit", () => {
    render(<UiKitApp />);

    const assembly = screen.getByTestId("ui-kit-company-portfolio-assembly");
    const slider = within(assembly).getByTestId("company-profile-portfolio-slider");
    const sliderScope = within(slider);
    const track = within(assembly).getByTestId("company-profile-portfolio-track");

    expect(track).toHaveStyle("transform: translateX(-0%)");

    fireEvent.click(sliderScope.getByRole("button", { name: TEXT.next }));

    expect(track).toHaveStyle("transform: translateX(-100%)");

    fireEvent.click(sliderScope.getByRole("button", { name: TEXT.previous }));

    expect(track).toHaveStyle("transform: translateX(-0%)");
  });

  it("renders the company portfolio viewer mode without the add-project button", () => {
    render(<UiKitApp />);

    const assembly = screen.getByTestId("ui-kit-company-portfolio-viewer-assembly");
    const slider = within(assembly).getByTestId("company-profile-portfolio-slider-viewer");
    const track = within(assembly).getByTestId("company-profile-portfolio-track");

    expect(slider.querySelector(".company-dashboard-portfolio__cta")).toBeNull();
    expect(track).toHaveStyle("transform: translateX(-0%)");

    fireEvent.click(within(slider).getAllByRole("button")[1]);

    expect(track).toHaveStyle("transform: translateX(-100%)");
  });

  it("updates the moderation revision reason inside the ui kit showcase", () => {
    render(<UiKitApp />);

    fireEvent.change(screen.getByLabelText(TEXT.reasonText), { target: { value: "Нужно уточнить программу мероприятия" } });

    const moderationDialogs = within(screen.getByTestId("ui-kit-moderation-action-dialogs"));

    expect(moderationDialogs.getByLabelText(TEXT.rejectionReason)).toHaveValue("Нужно уточнить программу мероприятия");
  });

  it("switches the complaint card preview to md size", () => {
    render(<UiKitApp />);

    fireEvent.change(screen.getByLabelText(TEXT.size), { target: { value: "md" } });

    expect(screen.getByTestId("ui-kit-complaint-card-preview")).toHaveClass("ui-complaint-card--md");
  });
});
