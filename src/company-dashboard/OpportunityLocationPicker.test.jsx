import { act, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  getFallbackCityOptionMock,
  reverseGeocodeAddressMock,
  searchAddressSuggestionsMock,
} = vi.hoisted(() => ({
  getFallbackCityOptionMock: vi.fn(),
  reverseGeocodeAddressMock: vi.fn(),
  searchAddressSuggestionsMock: vi.fn(),
}));

vi.mock("../api/addresses", () => ({
  searchAddressSuggestions: searchAddressSuggestionsMock,
  reverseGeocodeAddress: reverseGeocodeAddressMock,
  normalizeSelectedAddressLabel: (option) => String(option?.label ?? option?.value ?? "").trim(),
}));

vi.mock("../api/cities", () => ({
  getFallbackCityOption: getFallbackCityOptionMock,
}));

import { OpportunityLocationPicker } from "./OpportunityLocationPicker";

const mapInstances = [];

class MockYMap {
  constructor(container, props) {
    this.container = container;
    this.props = props;
    this.listenerProps = null;
    mapInstances.push(this);
  }

  addChild(child) {
    if (child.kind === "listener") {
      this.listenerProps = child.props;
      return;
    }

    if (child.kind === "marker") {
      this.container.appendChild(child.element);
    }
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

class MockYMapMarker {
  constructor(config, element) {
    this.kind = "marker";
    this.config = config;
    this.element = element;
  }
}

const ymaps3Mock = {
  ready: Promise.resolve(),
  YMap: MockYMap,
  YMapDefaultSchemeLayer: class {},
  YMapDefaultFeaturesLayer: class {},
  YMapFeatureDataSource: class {},
  YMapLayer: class {},
  YMapListener: MockYMapListener,
  YMapMarker: MockYMapMarker,
};

function OpportunityLocationPickerHarness() {
  return <OpportunityLocationPickerHarnessWithInitialState />;
}

function OpportunityLocationPickerHarnessWithInitialState({
  initialState = {
    locationCity: "",
    locationAddress: "",
    latitude: "",
    longitude: "",
  },
}) {
  const [state, setState] = useState({
    ...initialState,
  });

  return (
    <>
      <OpportunityLocationPicker
        {...state}
        onFieldChange={(field, value) => {
          setState((current) => ({ ...current, [field]: value }));
        }}
      />
      <output data-testid="coordinates-state">{`${state.latitude}|${state.longitude}`}</output>
    </>
  );
}

describe("OpportunityLocationPicker", () => {
  let originalApiKey;

  beforeEach(() => {
    originalApiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
    import.meta.env.VITE_YANDEX_MAPS_API_KEY = "test-key";
    global.window.ymaps3 = ymaps3Mock;
    mapInstances.length = 0;

    searchAddressSuggestionsMock.mockResolvedValue({ suggestions: [], nearbyStreetMatches: [] });
    reverseGeocodeAddressMock.mockReset();
    getFallbackCityOptionMock.mockReset();

    getFallbackCityOptionMock.mockImplementation((city) => (
      city
        ? { name: city, latitude: 56.1439, longitude: 47.251942 }
        : null
    ));
  });

  afterEach(() => {
    import.meta.env.VITE_YANDEX_MAPS_API_KEY = originalApiKey;
    delete global.window.ymaps3;
  });

  it("updates the form from a fast map click", async () => {
    reverseGeocodeAddressMock.mockResolvedValue({
      suggestions: [
        {
          label: "ул. Ленина, 1",
          city: "г. Чебоксары",
          latitude: 56.14391,
          longitude: 47.25195,
        },
      ],
      nearbyStreetMatches: [],
    });

    render(<OpportunityLocationPickerHarness />);

    await waitFor(() => expect(mapInstances).toHaveLength(1));
    expect(screen.queryByPlaceholderText("Москва")).not.toBeInTheDocument();

    await act(async () => {
      mapInstances[0].listenerProps.onFastClick?.(undefined, {
        coordinates: [47.25195, 56.14391],
      });
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByDisplayValue("56.14391")).toBeInTheDocument());
    expect(screen.getByDisplayValue("47.25195")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ул. Ленина, 1")).toBeInTheDocument();
    expect(reverseGeocodeAddressMock).toHaveBeenCalledWith({
      latitude: 56.14391,
      longitude: 47.25195,
    });
  });

  it("does not repeat reverse geocoding when fast click is followed by a regular click for the same point", async () => {
    reverseGeocodeAddressMock.mockResolvedValue({
      suggestions: [],
      nearbyStreetMatches: [],
    });

    render(<OpportunityLocationPickerHarness />);

    await waitFor(() => expect(mapInstances).toHaveLength(1));

    await act(async () => {
      const event = { coordinates: [47.251942, 56.1439] };
      mapInstances[0].listenerProps.onFastClick?.(undefined, event);
      mapInstances[0].listenerProps.onClick?.(undefined, event);
      await Promise.resolve();
    });

    await waitFor(() => expect(reverseGeocodeAddressMock).toHaveBeenCalledTimes(1));
    expect(screen.getByDisplayValue("56.1439")).toBeInTheDocument();
    expect(screen.getByDisplayValue("47.251942")).toBeInTheDocument();
  });

  it("keeps only the address input when the maps key is missing", () => {
    import.meta.env.VITE_YANDEX_MAPS_API_KEY = "";

    render(<OpportunityLocationPickerHarness />);

    expect(mapInstances).toHaveLength(0);
    expect(screen.getByPlaceholderText("Начните с улицы, дома или ориентира")).toBeInTheDocument();
    expect(screen.queryByText("Точка на карте")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Широта")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Долгота")).not.toBeInTheDocument();
    expect(screen.getByText("Карта в этой сборке недоступна. Публикацию можно сохранить только по адресу.")).toBeInTheDocument();
  });

  it("clears zero coordinates before using them in address lookup", async () => {
    render(
      <OpportunityLocationPickerHarnessWithInitialState
        initialState={{
          locationCity: "",
          locationAddress: "",
          latitude: "0",
          longitude: "0",
        }}
      />
    );

    await waitFor(() => expect(screen.getByTestId("coordinates-state")).toHaveTextContent("|"));
    expect(screen.getByText("Точка на карте еще не выбрана")).toBeInTheDocument();
    expect(screen.queryByText("Сбросить точку")).not.toBeInTheDocument();
  });
});
