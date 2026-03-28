const OPEN_METEO_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

export const DEFAULT_CITY_NAME = "Чебоксары";

const fallbackCityEntries = [
  { name: "Чебоксары", admin1: "Чувашия", country: "Россия", countryCode: "RU", latitude: 56.1439, longitude: 47.251942 },
  { name: "Москва", admin1: "Москва", country: "Россия", countryCode: "RU", latitude: 55.755814, longitude: 37.617635 },
  { name: "Казань", admin1: "Татарстан", country: "Россия", countryCode: "RU", latitude: 55.796127, longitude: 49.106414 },
  { name: "Санкт-Петербург", admin1: "Санкт-Петербург", country: "Россия", countryCode: "RU", latitude: 59.939099, longitude: 30.315877 },
  { name: "Нижний Новгород", admin1: "Нижегородская область", country: "Россия", countryCode: "RU", latitude: 56.326887, longitude: 44.005986 },
  { name: "Екатеринбург", admin1: "Свердловская область", country: "Россия", countryCode: "RU", latitude: 56.838011, longitude: 60.597465 },
  { name: "Новосибирск", admin1: "Новосибирская область", country: "Россия", countryCode: "RU", latitude: 55.030204, longitude: 82.92043 },
];

const citySearchCache = new Map();

export function normalizeCityName(value) {
  return String(value ?? "").trim().toLowerCase();
}

function buildCityLabel({ name, admin1, country }) {
  return [name, admin1, country && country !== "Россия" ? country : ""].filter(Boolean).join(", ");
}

export function createCityOption(entry) {
  const name = typeof entry === "string"
    ? String(entry).trim()
    : String(entry?.name ?? "").trim();

  if (!name) {
    return null;
  }

  const admin1 = String(entry?.admin1 ?? "").trim();
  const country = String(entry?.country ?? "").trim();
  const countryCode = String(entry?.countryCode ?? entry?.country_code ?? "").trim().toUpperCase();
  const latitude = Number(entry?.latitude);
  const longitude = Number(entry?.longitude);

  return {
    id: [name, admin1, countryCode].filter(Boolean).join("|").toLowerCase(),
    name,
    value: name,
    label: buildCityLabel({ name, admin1, country }),
    admin1,
    country,
    countryCode,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
  };
}

export const FALLBACK_CITY_OPTIONS = Object.freeze(
  fallbackCityEntries
    .map(createCityOption)
    .filter(Boolean)
);

function getCacheKey(query, { count, language, countryCode }) {
  return [normalizeCityName(query), count, language, countryCode].join("|");
}

function filterFallbackOptions(query) {
  const normalizedQuery = normalizeCityName(query);

  if (!normalizedQuery) {
    return [...FALLBACK_CITY_OPTIONS];
  }

  return FALLBACK_CITY_OPTIONS.filter((option) => {
    const searchLabel = [option.name, option.admin1, option.country].filter(Boolean).join(" ");
    return normalizeCityName(searchLabel).includes(normalizedQuery);
  });
}

export function mergeCityOptions(...optionGroups) {
  const dedupeMap = new Map();

  optionGroups.flat().forEach((option) => {
    const normalizedOption = createCityOption(option);

    if (!normalizedOption) {
      return;
    }

    const key = [normalizeCityName(normalizedOption.name), normalizeCityName(normalizedOption.admin1), normalizedOption.countryCode].join("|");

    if (!dedupeMap.has(key)) {
      dedupeMap.set(key, normalizedOption);
    }
  });

  return [...dedupeMap.values()];
}

export function getFallbackCityOption(cityName = DEFAULT_CITY_NAME) {
  const normalizedCityName = normalizeCityName(cityName);
  return FALLBACK_CITY_OPTIONS.find((option) => normalizeCityName(option.name) === normalizedCityName) ?? null;
}

function normalizeRemoteOptions(results) {
  return Array.isArray(results) ? results.map(createCityOption).filter(Boolean) : [];
}

export async function searchCityOptions(
  query,
  {
    signal,
    count = 8,
    language = "ru",
    countryCode = "RU",
  } = {}
) {
  const trimmedQuery = String(query ?? "").trim();

  if (!trimmedQuery) {
    return filterFallbackOptions("");
  }

  const cacheKey = getCacheKey(trimmedQuery, { count, language, countryCode });

  if (citySearchCache.has(cacheKey)) {
    return citySearchCache.get(cacheKey);
  }

  const requestUrl = new URL(OPEN_METEO_GEOCODING_URL);
  requestUrl.searchParams.set("name", trimmedQuery);
  requestUrl.searchParams.set("count", String(count));
  requestUrl.searchParams.set("language", language);
  requestUrl.searchParams.set("format", "json");

  if (countryCode) {
    requestUrl.searchParams.set("countryCode", countryCode);
  }

  const requestPromise = fetch(requestUrl.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`City search failed with status ${response.status}`);
      }

      const payload = await response.json();
      return mergeCityOptions(normalizeRemoteOptions(payload?.results), filterFallbackOptions(trimmedQuery));
    })
    .catch((error) => {
      citySearchCache.delete(cacheKey);
      throw error;
    });

  citySearchCache.set(cacheKey, requestPromise);
  return requestPromise;
}

export async function resolveCityOption(cityName, options = {}) {
  const normalizedCityName = normalizeCityName(cityName);

  if (!normalizedCityName) {
    return null;
  }

  const exactFallback = getFallbackCityOption(cityName);

  if (exactFallback) {
    return exactFallback;
  }

  const cityOptions = await searchCityOptions(cityName, options);

  return cityOptions.find((option) => normalizeCityName(option.name) === normalizedCityName) ?? cityOptions[0] ?? null;
}
