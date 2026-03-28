export const FAVORITE_OPPORTUNITY_IDS_STORAGE_KEY = "tramplin.favoriteOpportunityIds";
export const FAVORITE_COMPANY_IDS_STORAGE_KEY = "tramplin.favoriteCompanyIds";
export const FAVORITES_UPDATED_EVENT = "tramplin:favorites-updated";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function normalizeId(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue || null;
}

export function normalizeOpportunityId(opportunityId) {
  return normalizeId(opportunityId);
}

export function normalizeCompanyId(companyId) {
  return normalizeId(companyId);
}

export function extractOpportunityId(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  return normalizeOpportunityId(item.id ?? item.opportunityId);
}

export function extractCompanyId(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  return normalizeCompanyId(item.id ?? item.companyId ?? item.employerId);
}

function uniqueIds(ids, normalize) {
  return Array.from(new Set(ids.map(normalize).filter(Boolean)));
}

function readIds(storageKey, normalize) {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  try {
    const rawValue = storage.getItem(storageKey);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? uniqueIds(parsedValue, normalize) : [];
  } catch {
    return [];
  }
}

function readFavoritesSnapshot() {
  return {
    opportunityIds: readIds(FAVORITE_OPPORTUNITY_IDS_STORAGE_KEY, normalizeOpportunityId),
    companyIds: readIds(FAVORITE_COMPANY_IDS_STORAGE_KEY, normalizeCompanyId),
  };
}

function emitFavoritesUpdated(snapshot) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(FAVORITES_UPDATED_EVENT, {
      detail: {
        opportunityIds: uniqueIds(snapshot.opportunityIds ?? [], normalizeOpportunityId),
        companyIds: uniqueIds(snapshot.companyIds ?? [], normalizeCompanyId),
      },
    })
  );
}

function writeIds(storageKey, ids, normalize) {
  const storage = getStorage();
  const nextIds = uniqueIds(ids, normalize);

  if (!storage) {
    return nextIds;
  }

  try {
    storage.setItem(storageKey, JSON.stringify(nextIds));
  } catch {
    return nextIds;
  }

  emitFavoritesUpdated(readFavoritesSnapshot());
  return nextIds;
}

export function readFavoriteOpportunityIds() {
  return readIds(FAVORITE_OPPORTUNITY_IDS_STORAGE_KEY, normalizeOpportunityId);
}

export function readFavoriteCompanyIds() {
  return readIds(FAVORITE_COMPANY_IDS_STORAGE_KEY, normalizeCompanyId);
}

export function writeFavoriteOpportunityIds(ids) {
  return writeIds(FAVORITE_OPPORTUNITY_IDS_STORAGE_KEY, ids, normalizeOpportunityId);
}

export function writeFavoriteCompanyIds(ids) {
  return writeIds(FAVORITE_COMPANY_IDS_STORAGE_KEY, ids, normalizeCompanyId);
}

export function isFavoriteOpportunity(opportunityId) {
  const normalizedOpportunityId = normalizeOpportunityId(opportunityId);

  if (!normalizedOpportunityId) {
    return false;
  }

  return readFavoriteOpportunityIds().includes(normalizedOpportunityId);
}

export function isFavoriteCompany(companyId) {
  const normalizedCompanyId = normalizeCompanyId(companyId);

  if (!normalizedCompanyId) {
    return false;
  }

  return readFavoriteCompanyIds().includes(normalizedCompanyId);
}

export function setFavoriteOpportunity(opportunityId, enabled) {
  const normalizedOpportunityId = normalizeOpportunityId(opportunityId);

  if (!normalizedOpportunityId) {
    return false;
  }

  const currentIds = readFavoriteOpportunityIds();
  const nextIds = enabled
    ? uniqueIds([...currentIds, normalizedOpportunityId], normalizeOpportunityId)
    : currentIds.filter((id) => id !== normalizedOpportunityId);

  writeFavoriteOpportunityIds(nextIds);
  return enabled;
}

export function setFavoriteCompany(companyId, enabled) {
  const normalizedCompanyId = normalizeCompanyId(companyId);

  if (!normalizedCompanyId) {
    return false;
  }

  const currentIds = readFavoriteCompanyIds();
  const nextIds = enabled
    ? uniqueIds([...currentIds, normalizedCompanyId], normalizeCompanyId)
    : currentIds.filter((id) => id !== normalizedCompanyId);

  writeFavoriteCompanyIds(nextIds);
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

export function toggleFavoriteCompany(companyId) {
  const normalizedCompanyId = normalizeCompanyId(companyId);

  if (!normalizedCompanyId) {
    return false;
  }

  const nextState = !isFavoriteCompany(normalizedCompanyId);
  setFavoriteCompany(normalizedCompanyId, nextState);
  return nextState;
}

function getScopedFavorites(snapshot, scope) {
  if (scope === "all") {
    return snapshot;
  }

  if (scope === "companies") {
    return snapshot.companyIds;
  }

  return snapshot.opportunityIds;
}

export function subscribeToFavorites(listener, options = {}) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const scope = options.scope ?? "opportunities";

  const handleUpdate = (event) => {
    const snapshot =
      event?.type === FAVORITES_UPDATED_EVENT && event.detail && typeof event.detail === "object"
        ? {
            opportunityIds: uniqueIds(event.detail.opportunityIds ?? [], normalizeOpportunityId),
            companyIds: uniqueIds(event.detail.companyIds ?? [], normalizeCompanyId),
          }
        : readFavoritesSnapshot();

    listener(getScopedFavorites(snapshot, scope));
  };

  window.addEventListener(FAVORITES_UPDATED_EVENT, handleUpdate);
  window.addEventListener("storage", handleUpdate);

  return () => {
    window.removeEventListener(FAVORITES_UPDATED_EVENT, handleUpdate);
    window.removeEventListener("storage", handleUpdate);
  };
}
