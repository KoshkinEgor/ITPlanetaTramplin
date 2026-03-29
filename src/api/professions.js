import { apiRequest } from "../lib/http";

function normalizeProfessionOption(item) {
  const value = String(item?.value ?? "").trim();
  const label = String(item?.label ?? value).trim();

  if (!value || !label) {
    return null;
  }

  return { value, label };
}

export async function searchProfessionOptions(
  query,
  {
    count = 12,
    signal,
  } = {}
) {
  const searchParams = new URLSearchParams();
  const trimmedQuery = String(query ?? "").trim();

  if (trimmedQuery) {
    searchParams.set("query", trimmedQuery);
  }

  searchParams.set("count", String(Math.min(Math.max(Number(count) || 12, 1), 30)));

  const payload = await apiRequest(`/professions?${searchParams.toString()}`, { signal });

  return Array.isArray(payload?.items)
    ? payload.items.map(normalizeProfessionOption).filter(Boolean)
    : [];
}
