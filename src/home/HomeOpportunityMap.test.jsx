import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HomeOpportunityMap,
  buildPointCollectionSignature,
  computeAnchoredPreviewLayout,
} from "./HomeOpportunityMap";

vi.mock("../shared/ui", () => ({
  OpportunityMiniCard: ({ item, className, dismissAction, detailAction, variant }) => (
    <article className={`ui-card ${className}`.trim()} data-variant={variant}>
      <h3>{item.title}</h3>
      <button type="button" onClick={dismissAction?.onClick}>{dismissAction?.label ?? "close"}</button>
      <a href={detailAction?.href ?? "#"}>{detailAction?.label ?? "РџРѕРґСЂРѕР±РЅРµРµ"}</a>
    </article>
  ),
}));

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

const markerRectsById = {};
const mapInstances = [];
const updateCalls = [];

function buildBounds(location) {
  const [longitude, latitude] = location.center;
  const span = 24 / Math.max(location.zoom ?? 10, 1);

  return [
    [longitude - span, latitude - span],
    [longitude + span, latitude + span],
  ];
}

class MockYMap {
  constructor(container, props) {
    this.container = container;
    this.props = props;
    this.listener = null;
    this.location = {
      ...props.location,
      bounds: buildBounds(props.location),
    };
    mapInstances.push(this);
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
    updateCalls.push(nextProps.location);
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

class MockYMapListener {
  constructor(props) {
    this.kind = "listener";
    this.props = props;
  }
}

class MockYMapClusterer {
  constructor(props) {
    this.kind = "clusterer";
    this.props = props;
  }
}

class MockYMapMarker {
  constructor(config, element) {
    this.config = config;
    this.element = element;
  }
}

const ymaps3Mock = {
  ready: Promise.resolve(),
  import: Object.assign(
    vi.fn(async () => ({
      YMapClusterer: MockYMapClusterer,
      clusterByGrid: vi.fn(() => "cluster"),
    })),
    { registerCdn: vi.fn() }
  ),
  YMap: MockYMap,
  YMapDefaultSchemeLayer: class {},
  YMapFeatureDataSource: class {},
  YMapLayer: class {},
  YMapListener: MockYMapListener,
  YMapMarker: MockYMapMarker,
};

const baseItems = [
  {
    id: "1",
    title: "Alpha Point",
    coordinates: [37.61, 55.75],
    detailHref: "/alpha",
    eyebrow: "Р’Р°РєР°РЅСЃРёСЏ",
  },
  {
    id: "2",
    title: "Beta Point",
    coordinates: [37.62, 55.76],
    detailHref: "/beta",
    eyebrow: "РЎС‚Р°Р¶РёСЂРѕРІРєР°",
  },
];

const clusteredItems = [
  {
    id: "cluster-1",
    title: "Cluster Alpha",
    coordinates: [37.61, 55.75],
    detailHref: "/cluster-alpha",
    eyebrow: "Р’Р°РєР°РЅСЃРёСЏ",
    clusterGroup: "moscow-core",
  },
  {
    id: "cluster-2",
    title: "Cluster Beta",
    coordinates: [37.611, 55.751],
    detailHref: "/cluster-beta",
    eyebrow: "РЎС‚Р°Р¶РёСЂРѕРІРєР°",
    clusterGroup: "moscow-core",
  },
  {
    id: "cluster-3",
    title: "Cluster Gamma",
    coordinates: [37.78, 55.88],
    detailHref: "/cluster-gamma",
    eyebrow: "РњРµСЂРѕРїСЂРёСЏС‚РёРµ",
  },
];

describe("HomeOpportunityMap helpers", () => {
  it("builds a stable point signature independent of item order", () => {
    const points = baseItems.map((item) => ({
      ...item,
      markerTone: "blue",
      markerLabel: item.title,
    }));

    expect(buildPointCollectionSignature(points)).toBe(
      buildPointCollectionSignature([points[1], points[0]])
    );
  });

  it("places preview above the marker when there is enough space", () => {
    const layout = computeAnchoredPreviewLayout({
      mapSize: { width: 400, height: 300 },
      markerBox: { left: 188, top: 180, width: 24, height: 32, right: 212, bottom: 212 },
      previewSize: { width: 248, height: 116 },
    });

    expect(layout.placement).toBe("top");
    expect(layout.left).toBe(76);
    expect(layout.top).toBe(50);
  });

  it("flips preview below when there is not enough space above", () => {
    const layout = computeAnchoredPreviewLayout({
      mapSize: { width: 400, height: 300 },
      markerBox: { left: 188, top: 40, width: 24, height: 32, right: 212, bottom: 72 },
      previewSize: { width: 248, height: 116 },
    });

    expect(layout.placement).toBe("bottom");
    expect(layout.top).toBe(86);
  });

  it("clamps preview horizontally near the left edge", () => {
    const layout = computeAnchoredPreviewLayout({
      mapSize: { width: 400, height: 300 },
      markerBox: { left: 8, top: 180, width: 24, height: 32, right: 32, bottom: 212 },
      previewSize: { width: 248, height: 116 },
    });

    expect(layout.left).toBe(16);
    expect(layout.anchorLeft).toBe(24);
  });

  it("clamps preview horizontally near the right edge", () => {
    const layout = computeAnchoredPreviewLayout({
      mapSize: { width: 400, height: 300 },
      markerBox: { left: 368, top: 180, width: 24, height: 32, right: 392, bottom: 212 },
      previewSize: { width: 248, height: 116 },
    });

    expect(layout.left).toBe(136);
    expect(layout.anchorLeft).toBe(224);
  });

  it("chooses the side with more visible area when both sides are tight", () => {
    const layout = computeAnchoredPreviewLayout({
      mapSize: { width: 320, height: 220 },
      markerBox: { left: 150, top: 110, width: 20, height: 28, right: 170, bottom: 138 },
      previewSize: { width: 248, height: 116 },
    });

    expect(layout.placement).toBe("top");
    expect(layout.top).toBe(16);
  });
});

describe("HomeOpportunityMap", () => {
  let originalResizeObserver;
  let originalGetBoundingClientRect;
  let originalApiKey;

  beforeEach(() => {
    originalResizeObserver = global.ResizeObserver;
    originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    originalApiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
    import.meta.env.VITE_YANDEX_MAPS_API_KEY = "test-key";
    global.ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
    global.window.ymaps3 = ymaps3Mock;
    mapInstances.length = 0;
    updateCalls.length = 0;
    markerRectsById["1"] = createRect(188, 180, 24, 32);
    markerRectsById["2"] = createRect(20, 40, 24, 32);

    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (this.classList?.contains("home-yandex-map")) {
        return createRect(0, 0, 400, 300);
      }

      if (this.classList?.contains("home-yandex-map__preview-card")) {
        return createRect(0, 0, 248, 116);
      }

      if (this.classList?.contains("home-yandex-map__canvas")) {
        return createRect(0, 0, 400, 300);
      }

      if (this.dataset?.pointId && markerRectsById[this.dataset.pointId]) {
        return markerRectsById[this.dataset.pointId];
      }

      return createRect(0, 0, 0, 0);
    };
  });

  afterEach(() => {
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    global.ResizeObserver = originalResizeObserver;
    import.meta.env.VITE_YANDEX_MAPS_API_KEY = originalApiKey;
    delete global.window.ymaps3;
  });

  it("updates selected marker without recreating the map", async () => {
    const { rerender } = render(
      <HomeOpportunityMap items={baseItems} selectedCity="РњРѕСЃРєРІР°" activeId={null} onSelectItem={vi.fn()} />
    );

    await waitFor(() => expect(mapInstances).toHaveLength(1));
    expect(screen.getByLabelText("Alpha Point")).toHaveAttribute("aria-pressed", "false");

    rerender(<HomeOpportunityMap items={baseItems} selectedCity="РњРѕСЃРєРІР°" activeId="1" onSelectItem={vi.fn()} />);

    await waitFor(() => expect(screen.getByLabelText("Alpha Point")).toHaveAttribute("aria-pressed", "true"));
    expect(mapInstances).toHaveLength(1);
  });

  it("uses semantic type tones for markers when they are already provided", async () => {
    render(
      <HomeOpportunityMap
        items={[
          {
            id: "semantic-tone",
            title: "Semantic Tone Point",
            coordinates: [37.61, 55.75],
            detailHref: "/semantic-tone",
            typeTone: "teal",
          },
        ]}
        selectedCity="РњРѕСЃРєРІР°"
        activeId={null}
        onSelectItem={vi.fn()}
      />
    );

    const marker = await screen.findByLabelText("Semantic Tone Point");
    expect(marker.className).toContain("ui-map-marker--teal");
  });

  it("centers the initial map on the selected city coordinates instead of averaging point namesakes", async () => {
    render(
      <HomeOpportunityMap
        items={baseItems}
        selectedCity="Москва"
        selectedCityCoordinates={[35.99876, 57.01234]}
        activeId={null}
        onSelectItem={vi.fn()}
      />
    );

    await waitFor(() => expect(mapInstances).toHaveLength(1));
    expect(mapInstances[0].props.location.center).toEqual([35.99876, 57.01234]);
  });

  it("does not recreate the map when items are reordered but geometry stays the same", async () => {
    const { rerender } = render(
      <HomeOpportunityMap items={baseItems} selectedCity="РњРѕСЃРєРІР°" activeId={null} onSelectItem={vi.fn()} />
    );

    await waitFor(() => expect(mapInstances).toHaveLength(1));

    rerender(
      <HomeOpportunityMap items={[baseItems[1], baseItems[0]]} selectedCity="РњРѕСЃРєРІР°" activeId={null} onSelectItem={vi.fn()} />
    );

    await waitFor(() => expect(screen.getByLabelText("Alpha Point")).toBeInTheDocument());
    expect(mapInstances).toHaveLength(1);
  });

  it("anchors the preview to the marker instead of docking it to the map bottom", async () => {
    render(<HomeOpportunityMap items={baseItems} selectedCity="РњРѕСЃРєРІР°" activeId="1" onSelectItem={vi.fn()} />);

    await waitFor(() => expect(document.querySelector(".home-yandex-map__preview")).not.toBeNull());
    const previewShell = document.querySelector(".home-yandex-map__preview");

    await waitFor(() => expect(previewShell).toHaveClass("home-yandex-map__preview--top"));
    expect(previewShell.style.left).toBe("76px");
    expect(previewShell.style.top).toBe("50px");
    expect(previewShell.style.bottom).toBe("");
    expect(document.querySelector(".home-yandex-map__preview-card")).toHaveAttribute("data-variant", "map-compact");
  });

  it("focuses the selected marker with zoom-in only and never zooms out", async () => {
    const { rerender } = render(
      <HomeOpportunityMap items={baseItems} selectedCity="РњРѕСЃРєРІР°" activeId={null} onSelectItem={vi.fn()} />
    );

    await waitFor(() => expect(mapInstances).toHaveLength(1));

    rerender(<HomeOpportunityMap items={baseItems} selectedCity="РњРѕСЃРєРІР°" activeId="2" onSelectItem={vi.fn()} />);

    await waitFor(() => expect(updateCalls.length).toBeGreaterThan(0));
    expect(updateCalls.some((location) => location.zoom >= 16.5)).toBe(true);
    expect(updateCalls.every((location) => location.zoom == null || location.zoom >= 10.2)).toBe(true);
  });

  it("zooms into a cluster and clears the active preview instead of expanding it inline", async () => {
    const onSelectItem = vi.fn();

    render(<HomeOpportunityMap items={clusteredItems} selectedCity="Р СљР С•РЎРѓР С”Р Р†Р В°" activeId="cluster-3" onSelectItem={onSelectItem} />);

    const cluster = await screen.findByRole("button", { name: /2/ });
    fireEvent.click(cluster);

    await waitFor(() => expect(updateCalls.length).toBeGreaterThan(0));
    expect(onSelectItem).toHaveBeenCalledWith(null);
    expect(updateCalls.some((location) => location.center?.[0] === 37.6105 && location.center?.[1] === 55.7505)).toBe(true);
    expect(updateCalls.some((location) => location.zoom === 17)).toBe(true);
  });

  it("clicks markers through the existing selection callback", async () => {
    const onSelectItem = vi.fn();

    render(<HomeOpportunityMap items={baseItems} selectedCity="РњРѕСЃРєРІР°" activeId={null} onSelectItem={onSelectItem} />);

    const marker = await screen.findByLabelText("Alpha Point");
    fireEvent.click(marker);

    expect(onSelectItem).toHaveBeenCalledWith("1");
  });

  it("opens preview on hover or focus and closes it after pointer leave", async () => {
    render(<HomeOpportunityMap items={baseItems} selectedCity="РњРѕСЃРєРІР°" activeId={null} onSelectItem={vi.fn()} />);

    const marker = await screen.findByLabelText("Alpha Point");

    fireEvent.mouseEnter(marker);

    await waitFor(() => expect(document.querySelector(".home-yandex-map__preview")).not.toBeNull());

    fireEvent.mouseLeave(marker);

    await waitFor(() => expect(document.querySelector(".home-yandex-map__preview")).toBeNull());

    fireEvent.focus(marker);

    await waitFor(() => expect(document.querySelector(".home-yandex-map__preview")).not.toBeNull());
  });
});
