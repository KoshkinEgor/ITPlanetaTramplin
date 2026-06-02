import { apiRequest } from "../lib/http";

function normalizeInstitutionOption(item) {
  const value = String(item?.value ?? "").trim();
  const label = String(item?.label ?? value).trim();

  if (!value || !label) {
    return null;
  }

  return { value, label };
}

export async function searchInstitutionOptions(
  query,
  {
    limit = 12,
    signal,
  } = {}
) {
  const searchParams = new URLSearchParams();
  const trimmedQuery = String(query ?? "").trim();

  if (trimmedQuery) {
    searchParams.set("query", trimmedQuery);
  }

  searchParams.set("limit", String(Math.min(Math.max(Number(limit) || 12, 1), 30)));

  const payload = await apiRequest(`/education/institutions?${searchParams.toString()}`, { signal });

  return Array.isArray(payload?.Items || payload?.items)
    ? (payload.Items || payload.items).map(normalizeInstitutionOption).filter(Boolean)
    : [];
}
