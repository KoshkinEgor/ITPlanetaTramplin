export const AUTH_SESSION_TOKEN_STORAGE_KEY = "tramplin.auth.token";
export const AUTH_SESSION_TAB_ID_STORAGE_KEY = "tramplin.auth.tabId";
export const AUTH_SESSION_ACTIVE_TAB_STORAGE_KEY_PREFIX = "tramplin.auth.activeTab.";

const AUTH_SESSION_GLOBAL_STATE_KEY = "__tramplinAuthSessionState";

function getAuthSessionGlobalState() {
  const existingState = globalThis[AUTH_SESSION_GLOBAL_STATE_KEY];

  if (existingState && typeof existingState === "object") {
    return existingState;
  }

  const nextState = {
    activeTabId: null,
    cleanupRegistered: false,
  };

  globalThis[AUTH_SESSION_GLOBAL_STATE_KEY] = nextState;
  return nextState;
}

const authSessionGlobalState = getAuthSessionGlobalState();

function getSessionStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function createTabId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getNavigationType() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    if (typeof window.performance?.getEntriesByType === "function") {
      const [entry] = window.performance.getEntriesByType("navigation");
      return typeof entry?.type === "string" ? entry.type : "";
    }
  } catch {
    // Ignore navigation timing access errors and fall back to default behaviour.
  }

  return "";
}

function getActiveTabStorageKey(tabId) {
  return `${AUTH_SESSION_ACTIVE_TAB_STORAGE_KEY_PREFIX}${tabId}`;
}

function unregisterActiveTabMarker(tabId) {
  const storage = getLocalStorage();

  if (!storage || !tabId) {
    return;
  }

  try {
    storage.removeItem(getActiveTabStorageKey(tabId));
  } catch {
    // Ignore storage failures and keep auth state handling deterministic.
  }
}

function registerTabCleanupListener() {
  if (authSessionGlobalState.cleanupRegistered || typeof window === "undefined") {
    return;
  }

  const handlePageLeave = () => {
    unregisterActiveTabMarker(authSessionGlobalState.activeTabId);
  };

  window.addEventListener("pagehide", handlePageLeave);
  window.addEventListener("beforeunload", handlePageLeave);
  authSessionGlobalState.cleanupRegistered = true;
}

export function ensureAuthSessionTabScope() {
  const sessionStorage = getSessionStorage();
  const localStorage = getLocalStorage();

  if (!sessionStorage) {
    return null;
  }

  let tabId = null;

  try {
    const storedTabId = sessionStorage.getItem(AUTH_SESSION_TAB_ID_STORAGE_KEY);
    tabId = typeof storedTabId === "string" && storedTabId.trim() ? storedTabId.trim() : null;
  } catch {
    tabId = null;
  }

  const navigationType = getNavigationType();
  const hasDifferentActiveOwner = Boolean(tabId && localStorage && authSessionGlobalState.activeTabId !== tabId);
  const hasExistingActiveMarker = Boolean(tabId && localStorage?.getItem(getActiveTabStorageKey(tabId)));
  const isReloadNavigation = navigationType === "reload" || navigationType === "back_forward";

  if (hasDifferentActiveOwner && hasExistingActiveMarker && !isReloadNavigation) {
    try {
      sessionStorage.removeItem(AUTH_SESSION_TOKEN_STORAGE_KEY);
    } catch {
      // Ignore storage failures and keep auth state handling deterministic.
    }

    tabId = null;
  }

  if (!tabId) {
    tabId = createTabId();

    try {
      sessionStorage.setItem(AUTH_SESSION_TAB_ID_STORAGE_KEY, tabId);
    } catch {
      return null;
    }
  }

  authSessionGlobalState.activeTabId = tabId;

  if (localStorage) {
    try {
      localStorage.setItem(getActiveTabStorageKey(tabId), String(Date.now()));
    } catch {
      // Ignore storage failures and keep auth state handling deterministic.
    }
  }

  registerTabCleanupListener();
  return tabId;
}

export function getStoredAuthToken() {
  ensureAuthSessionTabScope();
  const storage = getSessionStorage();

  if (!storage) {
    return null;
  }

  try {
    const value = storage.getItem(AUTH_SESSION_TOKEN_STORAGE_KEY);
    return typeof value === "string" && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token) {
  ensureAuthSessionTabScope();
  const storage = getSessionStorage();
  const normalizedToken = typeof token === "string" ? token.trim() : "";

  if (!storage || !normalizedToken) {
    clearStoredAuthToken();
    return null;
  }

  try {
    storage.setItem(AUTH_SESSION_TOKEN_STORAGE_KEY, normalizedToken);
    return normalizedToken;
  } catch {
    return null;
  }
}

export function clearStoredAuthToken() {
  ensureAuthSessionTabScope();
  const storage = getSessionStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(AUTH_SESSION_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage failures and keep auth state handling deterministic.
  }
}

ensureAuthSessionTabScope();
