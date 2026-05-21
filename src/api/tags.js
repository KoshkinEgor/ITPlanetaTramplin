import { apiRequest } from "../lib/http";

export function getTags({ query = "", limit = 60 } = {}, signal) {
  const searchParams = new URLSearchParams();

  if (query) {
    searchParams.set("query", query);
  }

  if (limit) {
    searchParams.set("limit", String(limit));
  }

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return apiRequest(`/tags${suffix}`, { signal });
}
