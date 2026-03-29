import { searchAddressSuggestions } from "./addresses";

const OPEN_METEO_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const YANDEX_CITY_KIND = "city";

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

function normalizeCoordinateNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function formatCoordinateToken(value) {
  const numericValue = normalizeCoordinateNumber(value);
  return numericValue == null ? "" : numericValue.toFixed(5);
}

function buildCityLabel({ name, admin1, admin2, country }) {
  return [
    name,
    admin1 && admin1 !== name ? admin1 : "",
    admin2 && admin2 !== admin1 ? admin2 : "",
    country && country !== "Россия" ? country : "",
  ]
    .filter(Boolean)
    .join(", ");
}

function buildCityOptionId({ name, admin1, admin2, countryCode, latitude, longitude }) {
  return [
    normalizeCityName(name),
    normalizeCityName(admin1),
    normalizeCityName(admin2),
    String(countryCode ?? "").trim().toLowerCase(),
    formatCoordinateToken(latitude),
    formatCoordinateToken(longitude),
  ]
    .filter(Boolean)
    .join("|");
}

function hasOptionCoordinates(option) {
  return normalizeCoordinateNumber(option?.latitude) != null && normalizeCoordinateNumber(option?.longitude) != null;
}

export function createCityOption(entry) {
  const name = typeof entry === "string"
    ? String(entry).trim()
    : String(entry?.name ?? "").trim();

  if (!name) {
    return null;
  }

  const admin1 = String(entry?.admin1 ?? "").trim();
  const admin2 = String(entry?.admin2 ?? "").trim();
  const country = String(entry?.country ?? "").trim();
  const countryCode = String(entry?.countryCode ?? entry?.country_code ?? "").trim().toUpperCase();
  const latitude = normalizeCoordinateNumber(entry?.latitude);
  const longitude = normalizeCoordinateNumber(entry?.longitude);

  return {
    id: buildCityOptionId({ name, admin1, admin2, countryCode, latitude, longitude }),
    name,
    value: name,
    label: buildCityLabel({ name, admin1, admin2, country }),
    admin1,
    admin2,
    country,
    countryCode,
    latitude,
    longitude,
  };
}

export const FALLBACK_CITY_OPTIONS = Object.freeze(
  fallbackCityEntries
    .map(createCityOption)
    .filter(Boolean)
);

function getCacheKey(query, { count, language, countryCode, source = "open-meteo" }) {
  return [source, normalizeCityName(query), count, language, countryCode].join("|");
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
  const groupedOptions = new Map();

  function getLooseKey(option) {
    return [
      normalizeCityName(option?.name),
      String(option?.countryCode ?? "").trim().toLowerCase(),
    ]
      .filter(Boolean)
      .join("|");
  }

  function getSemanticKey(option) {
    return [
      normalizeCityName(option?.name),
      normalizeCityName(option?.admin1),
      normalizeCityName(option?.admin2),
      String(option?.countryCode ?? "").trim().toLowerCase(),
    ]
      .filter(Boolean)
      .join("|");
  }

  function getCoordinateKey(option) {
    if (!hasOptionCoordinates(option)) {
      return "";
    }

    return [
      normalizeCityName(option?.name),
      String(option?.countryCode ?? "").trim().toLowerCase(),
      formatCoordinateToken(option?.latitude),
      formatCoordinateToken(option?.longitude),
    ]
      .filter(Boolean)
      .join("|");
  }

  function getOptionScore(option) {
    return [
      hasOptionCoordinates(option) ? 4 : 0,
      option?.admin2 ? 2 : 0,
      option?.admin1 ? 1 : 0,
      option?.country ? 1 : 0,
    ].reduce((total, value) => total + value, 0);
  }

  optionGroups.flat().forEach((option) => {
    const normalizedOption = createCityOption(option);

    if (!normalizedOption) {
      return;
    }

    const looseKey = getLooseKey(normalizedOption) || normalizedOption.id;
    const semanticKey = getSemanticKey(normalizedOption) || normalizedOption.id;
    const coordinateKey = getCoordinateKey(normalizedOption);
    const currentGroup = groupedOptions.get(looseKey) ?? [];
    const currentCoordinateIndex = coordinateKey
      ? currentGroup.findIndex((entry) => getCoordinateKey(entry) === coordinateKey)
      : -1;

    if (currentCoordinateIndex >= 0) {
      if (getOptionScore(normalizedOption) >= getOptionScore(currentGroup[currentCoordinateIndex])) {
        currentGroup[currentCoordinateIndex] = normalizedOption;
      }

      groupedOptions.set(looseKey, currentGroup);
      return;
    }

    if (hasOptionCoordinates(normalizedOption)) {
      const nonCoordinateIndices = currentGroup
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => !hasOptionCoordinates(entry))
        .map(({ index }) => index)
        .reverse();

      nonCoordinateIndices.forEach((index) => {
        currentGroup.splice(index, 1);
      });

      currentGroup.push(normalizedOption);
      groupedOptions.set(looseKey, currentGroup);
      return;
    }

    if (currentGroup.some((entry) => hasOptionCoordinates(entry))) {
      return;
    }

    const currentSemanticIndex = currentGroup.findIndex((entry) => getSemanticKey(entry) === semanticKey);

    if (currentSemanticIndex >= 0) {
      if (getOptionScore(normalizedOption) >= getOptionScore(currentGroup[currentSemanticIndex])) {
        currentGroup[currentSemanticIndex] = normalizedOption;
      }
    } else {
      currentGroup.push(normalizedOption);
    }

    groupedOptions.set(looseKey, currentGroup);
  });

  return [...groupedOptions.values()].flat();
}

export function getFallbackCityOption(cityName = DEFAULT_CITY_NAME) {
  const normalizedCityName = normalizeCityName(cityName);
  return FALLBACK_CITY_OPTIONS.find((option) => normalizeCityName(option.name) === normalizedCityName) ?? null;
}

function normalizeRemoteOptions(results) {
  return Array.isArray(results) ? results.map(createCityOption).filter(Boolean) : [];
}

function createYandexCityOption(option) {
  const name = String(option?.city ?? option?.label ?? option?.value ?? "").trim();

  if (!name) {
    return null;
  }

  return createCityOption({
    name,
    admin1: String(option?.details ?? "").trim(),
    country: "Россия",
    countryCode: "RU",
    latitude: option?.latitude,
    longitude: option?.longitude,
  });
}

function isYandexCityLikeOption(option) {
  if (String(option?.kind ?? "").trim().toLowerCase() === YANDEX_CITY_KIND) {
    return true;
  }

  return Boolean(option?.city) && !option?.street && !option?.house;
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

export async function searchYandexCityOptions(
  query,
  {
    signal,
    count = 8,
  } = {}
) {
  const trimmedQuery = String(query ?? "").trim();

  if (!trimmedQuery) {
    return filterFallbackOptions("");
  }

  const cacheKey = getCacheKey(trimmedQuery, {
    count,
    language: "ru",
    countryCode: "RU",
    source: "yandex",
  });

  if (citySearchCache.has(cacheKey)) {
    return citySearchCache.get(cacheKey);
  }

  const requestPromise = searchAddressSuggestions(trimmedQuery, {
    signal,
    count: Math.min(Math.max(Number(count) || 8, 1), 10),
  })
    .then((payload) => {
      const yandexOptions = (Array.isArray(payload?.suggestions) ? payload.suggestions : [])
        .filter(isYandexCityLikeOption)
        .map(createYandexCityOption)
        .filter(Boolean);

      return mergeCityOptions(yandexOptions, filterFallbackOptions(trimmedQuery)).slice(0, count);
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

  const searchFn = typeof options.searchOptions === "function"
    ? options.searchOptions
    : searchCityOptions;
  const cityOptions = await searchFn(cityName, options);

  return cityOptions.find((option) => normalizeCityName(option.name) === normalizedCityName) ?? cityOptions[0] ?? null;
}
