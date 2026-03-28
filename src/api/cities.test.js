import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_CITY_NAME,
  FALLBACK_CITY_OPTIONS,
  getFallbackCityOption,
  mergeCityOptions,
  searchCityOptions,
} from "./cities";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("cities api", () => {
  it("keeps Cheboksary as the default city and exposes a fallback option for it", () => {
    expect(DEFAULT_CITY_NAME).toBe("Чебоксары");
    expect(getFallbackCityOption(DEFAULT_CITY_NAME)).toMatchObject({
      name: "Чебоксары",
      latitude: 56.1439,
      longitude: 47.251942,
    });
  });

  it("deduplicates options by city and region", () => {
    const options = mergeCityOptions(
      FALLBACK_CITY_OPTIONS.slice(0, 2),
      [{ name: "Чебоксары", admin1: "Чувашия", countryCode: "RU" }],
      [{ name: "Чебоксары", admin1: "Чувашия", countryCode: "RU" }]
    );

    expect(options.filter((option) => option.name === "Чебоксары")).toHaveLength(1);
  });

  it("loads city suggestions from the remote geocoding source and appends local fallback matches", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            name: "Чебоксары",
            admin1: "Chuvashia",
            country: "Russia",
            country_code: "RU",
            latitude: 56.1439,
            longitude: 47.251942,
          },
        ],
      }),
    });

    const options = await searchCityOptions("Чебоксары");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("geocoding-api.open-meteo.com");
    expect(fetchMock.mock.calls[0][0]).toContain("name=%D0%A7%D0%B5%D0%B1%D0%BE%D0%BA%D1%81%D0%B0%D1%80%D1%8B");
    expect(options[0]).toMatchObject({
      name: "Чебоксары",
      latitude: 56.1439,
      longitude: 47.251942,
    });
  });
});
