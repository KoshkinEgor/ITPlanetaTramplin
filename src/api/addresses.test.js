import { describe, expect, it, vi } from "vitest";
import { reverseGeocodeAddress, searchAddressSuggestions } from "./addresses";

vi.mock("../lib/http", () => ({
  apiRequest: vi.fn(async (path) => {
    if (String(path).startsWith("/location/address-suggestions")) {
      return {
        suggestions: [
          {
            value: "ул Тестовая, д 1",
            unrestrictedValue: "г Москва, ул Тестовая, д 1",
            label: "ул Тестовая, д. 1",
            details: "Москва",
            city: "Москва",
            street: "Тестовая",
            house: "1",
            kind: "house",
            latitude: 55.75581,
            longitude: 37.61771,
          },
        ],
        nearbyStreetMatches: [
          {
            value: "ул Тестовая, д 3",
            unrestrictedValue: "г Москва, ул Тестовая, д 3",
            label: "ул Тестовая, д. 3",
            details: "Москва",
            city: "Москва",
            street: "Тестовая",
            house: "3",
            kind: "house",
            latitude: 55.75582,
            longitude: 37.61774,
          },
        ],
      };
    }

    return {
      suggestions: [
        {
          value: "ул Тестовая, д 1",
          unrestrictedValue: "г Москва, ул Тестовая, д 1",
          label: "ул Тестовая, д. 1",
          city: "Москва",
          kind: "house",
          latitude: 55.75581,
          longitude: 37.61771,
        },
      ],
      nearbyStreetMatches: [],
    };
  }),
}));

describe("addresses api", () => {
  it("loads address suggestions and preserves nearby street matches", async () => {
    const result = await searchAddressSuggestions("Тестовая", {
      city: "Москва",
      latitude: 55.75,
      longitude: 37.61,
    });

    expect(result.suggestions[0]).toMatchObject({
      label: "ул Тестовая, д. 1",
      city: "Москва",
      kind: "house",
      latitude: 55.75581,
      longitude: 37.61771,
    });
    expect(result.nearbyStreetMatches[0]).toMatchObject({
      label: "ул Тестовая, д. 3",
      house: "3",
    });
  });

  it("returns an empty lookup for too-short queries", async () => {
    const result = await searchAddressSuggestions("Т");
    expect(result).toEqual({
      suggestions: [],
      nearbyStreetMatches: [],
    });
  });

  it("reverse geocodes a valid point", async () => {
    const result = await reverseGeocodeAddress({
      latitude: 55.75581,
      longitude: 37.61771,
    });

    expect(result.suggestions[0]).toMatchObject({
      label: "ул Тестовая, д. 1",
      kind: "house",
    });
  });
});
