import { apiRequest } from "../lib/http";

const emptyLookupResult = Object.freeze({
  suggestions: [],
  nearbyStreetMatches: [],
});

function normalizeCoordinate(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeAddressSuggestion(option) {
  const label = String(option?.label ?? option?.value ?? "").trim();

  if (!label) {
    return null;
  }

  const value = String(option?.value ?? label).trim();
  const unrestrictedValue = String(option?.unrestrictedValue ?? value).trim();

  return {
    value,
    unrestrictedValue,
    label,
    details: String(option?.details ?? "").trim(),
    city: String(option?.city ?? "").trim(),
    street: String(option?.street ?? "").trim(),
    house: String(option?.house ?? "").trim(),
    kind: String(option?.kind ?? "address").trim() || "address",
    latitude: normalizeCoordinate(option?.latitude),
    longitude: normalizeCoordinate(option?.longitude),
    streetFiasId: String(option?.streetFiasId ?? "").trim(),
    fiasId: String(option?.fiasId ?? "").trim(),
  };
}

function normalizeLookupResult(payload) {
  const suggestions = Array.isArray(payload?.suggestions)
    ? payload.suggestions.map(normalizeAddressSuggestion).filter(Boolean)
    : [];
  const nearbyStreetMatches = Array.isArray(payload?.nearbyStreetMatches)
    ? payload.nearbyStreetMatches.map(normalizeAddressSuggestion).filter(Boolean)
    : [];

  return {
    suggestions,
    nearbyStreetMatches,
  };
}

function buildLookupSearchParams({ query, city, latitude, longitude, count }) {
  const searchParams = new URLSearchParams();
  searchParams.set("query", String(query ?? "").trim());

  if (city) {
    searchParams.set("city", String(city).trim());
  }

  if (Number.isFinite(Number(latitude))) {
    searchParams.set("latitude", String(Number(latitude)));
  }

  if (Number.isFinite(Number(longitude))) {
    searchParams.set("longitude", String(Number(longitude)));
  }

  searchParams.set("count", String(count));
  return searchParams;
}

export async function searchAddressSuggestions(
  query,
  {
    city = "",
    latitude = null,
    longitude = null,
    count = 8,
    signal,
  } = {}
) {
  const trimmedQuery = String(query ?? "").trim();

  if (trimmedQuery.length < 2) {
    return emptyLookupResult;
  }

  const searchParams = buildLookupSearchParams({
    query: trimmedQuery,
    city,
    latitude,
    longitude,
    count: Math.min(Math.max(Number(count) || 8, 1), 10),
  });

  const response = await apiRequest(`/location/address-suggestions?${searchParams.toString()}`, { signal });
  return normalizeLookupResult(response);
}

export async function reverseGeocodeAddress(
  {
    latitude,
    longitude,
    count = 6,
    signal,
  } = {}
) {
  const normalizedLatitude = normalizeCoordinate(latitude);
  const normalizedLongitude = normalizeCoordinate(longitude);

  if (normalizedLatitude == null || normalizedLongitude == null) {
    return emptyLookupResult;
  }

  const searchParams = new URLSearchParams({
    latitude: String(normalizedLatitude),
    longitude: String(normalizedLongitude),
    count: String(Math.min(Math.max(Number(count) || 6, 1), 10)),
  });

  const response = await apiRequest(`/location/reverse-geocode?${searchParams.toString()}`, { signal });
  return normalizeLookupResult(response);
}

export function normalizeSelectedAddressLabel(option) {
  return String(option?.label ?? option?.value ?? "").trim();
}
