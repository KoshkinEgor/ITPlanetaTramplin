function normalizeApiBaseUrl(value) {
  const fallback = "/api";

  if (!value) {
    return fallback;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return fallback;
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue.replace(/\/+$/, "");
  }

  const normalizedPath = trimmedValue.replace(/^\/+/, "").replace(/\/+$/, "");
  return normalizedPath ? `/${normalizedPath}` : fallback;
}

export const appConfig = Object.freeze({
  apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
});
