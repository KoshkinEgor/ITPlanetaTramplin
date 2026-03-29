import { afterEach, describe, expect, it, vi } from "vitest";

async function loadCitiesModule() {
  vi.resetModules();
  return import("./cities");
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("cities api", () => {
  it("keeps Cheboksary as the default city and exposes a fallback option for it", async () => {
    const { DEFAULT_CITY_NAME, getFallbackCityOption } = await loadCitiesModule();

    expect(DEFAULT_CITY_NAME).toBe("Чебоксары");
    expect(getFallbackCityOption(DEFAULT_CITY_NAME)).toMatchObject({
      name: "Чебоксары",
      latitude: 56.1439,
      longitude: 47.251942,
    });
  });

  it("deduplicates options when city, region, country, and coordinates are the same", async () => {
    const { FALLBACK_CITY_OPTIONS, mergeCityOptions } = await loadCitiesModule();

    const options = mergeCityOptions(
      FALLBACK_CITY_OPTIONS.slice(0, 2),
      [{ name: "Чебоксары", admin1: "Чувашия", countryCode: "RU", latitude: 56.1439, longitude: 47.251942 }],
      [{ name: "Чебоксары", admin1: "Чувашия", countryCode: "RU", latitude: 56.1439, longitude: 47.251942 }]
    );

    expect(options.filter((option) => option.name === "Чебоксары")).toHaveLength(1);
  });

  it("keeps same-name settlements with different coordinates as separate options", async () => {
    const { mergeCityOptions } = await loadCitiesModule();

    const options = mergeCityOptions([
      {
        name: "Москва",
        admin1: "Тверская область",
        admin2: "Осташковский район",
        countryCode: "RU",
        latitude: 57.01234,
        longitude: 35.99876,
      },
      {
        name: "Москва",
        admin1: "Тверская область",
        admin2: "Осташковский район",
        countryCode: "RU",
        latitude: 56.95555,
        longitude: 36.11111,
      },
    ]);

    expect(options).toHaveLength(2);
    expect(options[0].id).not.toBe(options[1].id);
    expect(options.every((option) => option.label === "Москва, Тверская область, Осташковский район")).toBe(true);
  });

  it("loads city suggestions from the remote geocoding source and appends local fallback matches", async () => {
    const { searchCityOptions } = await loadCitiesModule();

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
