export const FAVORITE_OPPORTUNITY_IDS_STORAGE_KEY = "tramplin.favoriteOpportunityIds";
export const FAVORITES_UPDATED_EVENT = "tramplin:favorites-updated";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function normalizeOpportunityId(opportunityId) {
  const value = String(opportunityId ?? "").trim();
  return value || null;
}

export function extractOpportunityId(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  return normalizeOpportunityId(item.id ?? item.opportunityId);
}

function uniqueIds(ids) {
  return Array.from(new Set(ids.map(normalizeOpportunityId).filter(Boolean)));
}

function emitFavoritesUpdated(ids) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT, { detail: uniqueIds(ids) }));
}

export function readFavoriteOpportunityIds() {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  try {
    const rawValue = storage.getItem(FAVORITE_OPPORTUNITY_IDS_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? uniqueIds(parsedValue) : [];
  } catch {
    return [];
  }
}

export function writeFavoriteOpportunityIds(ids) {
  const storage = getStorage();
  const nextIds = uniqueIds(ids);

  if (!storage) {
    return nextIds;
  }

  try {
    storage.setItem(FAVORITE_OPPORTUNITY_IDS_STORAGE_KEY, JSON.stringify(nextIds));
  } catch {
    return nextIds;
  }

  emitFavoritesUpdated(nextIds);
  return nextIds;
}

export function isFavoriteOpportunity(opportunityId) {
  const normalizedOpportunityId = normalizeOpportunityId(opportunityId);

  if (!normalizedOpportunityId) {
    return false;
  }

  return readFavoriteOpportunityIds().includes(normalizedOpportunityId);
}

export function setFavoriteOpportunity(opportunityId, enabled) {
  const normalizedOpportunityId = normalizeOpportunityId(opportunityId);

  if (!normalizedOpportunityId) {
    return false;
  }

  const currentIds = readFavoriteOpportunityIds();
  const nextIds = enabled
    ? uniqueIds([...currentIds, normalizedOpportunityId])
    : currentIds.filter((id) => id !== normalizedOpportunityId);

  writeFavoriteOpportunityIds(nextIds);
  return enabled;
}

export function toggleFavoriteOpportunity(opportunityId) {
  const normalizedOpportunityId = normalizeOpportunityId(opportunityId);

  if (!normalizedOpportunityId) {
    return false;
  }

  const nextState = !isFavoriteOpportunity(normalizedOpportunityId);
  setFavoriteOpportunity(normalizedOpportunityId, nextState);
  return nextState;
}

export function subscribeToFavorites(listener) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleUpdate = () => {
    listener(readFavoriteOpportunityIds());
  };

  window.addEventListener(FAVORITES_UPDATED_EVENT, handleUpdate);
  window.addEventListener("storage", handleUpdate);

  return () => {
    window.removeEventListener(FAVORITES_UPDATED_EVENT, handleUpdate);
    window.removeEventListener("storage", handleUpdate);
  };
}
