import { afterEach, describe, expect, it, vi } from "vitest";

const AUTH_SESSION_TOKEN_STORAGE_KEY = "tramplin.auth.token";
const AUTH_SESSION_TAB_ID_STORAGE_KEY = "tramplin.auth.tabId";
const AUTH_SESSION_ACTIVE_TAB_STORAGE_KEY_PREFIX = "tramplin.auth.activeTab.";

function mockNavigationType(type = "navigate") {
  Object.defineProperty(window.performance, "getEntriesByType", {
    configurable: true,
    value: vi.fn(() => [{ type }]),
  });
}

async function loadSessionTokenModule() {
  vi.resetModules();
  return import("./session-token");
}

afterEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("auth session token storage", () => {
  it("stores auth token in sessionStorage for the current window", async () => {
    mockNavigationType();
    const { setStoredAuthToken, getStoredAuthToken } = await loadSessionTokenModule();

    expect(setStoredAuthToken("  test-token  ")).toBe("test-token");
    expect(window.sessionStorage.getItem(AUTH_SESSION_TOKEN_STORAGE_KEY)).toBe("test-token");
    expect(getStoredAuthToken()).toBe("test-token");
  });

  it("clears auth token from sessionStorage", async () => {
    mockNavigationType();
    const { clearStoredAuthToken, getStoredAuthToken } = await loadSessionTokenModule();

    window.sessionStorage.setItem(AUTH_SESSION_TOKEN_STORAGE_KEY, "test-token");

    clearStoredAuthToken();

    expect(window.sessionStorage.getItem(AUTH_SESSION_TOKEN_STORAGE_KEY)).toBeNull();
    expect(getStoredAuthToken()).toBeNull();
  });

  it("drops a cloned auth token when a new tab reuses another tab's scope", async () => {
    const clonedTabId = "shared-tab";
    mockNavigationType("navigate");
    window.sessionStorage.setItem(AUTH_SESSION_TOKEN_STORAGE_KEY, "cloned-token");
    window.sessionStorage.setItem(AUTH_SESSION_TAB_ID_STORAGE_KEY, clonedTabId);
    window.localStorage.setItem(`${AUTH_SESSION_ACTIVE_TAB_STORAGE_KEY_PREFIX}${clonedTabId}`, String(Date.now()));

    const { getStoredAuthToken, ensureAuthSessionTabScope } = await loadSessionTokenModule();

    ensureAuthSessionTabScope();

    expect(getStoredAuthToken()).toBeNull();
    expect(window.sessionStorage.getItem(AUTH_SESSION_TAB_ID_STORAGE_KEY)).not.toBe(clonedTabId);
  });

  it("keeps the auth token when the same tab reloads", async () => {
    const currentTabId = "current-tab";
    mockNavigationType("reload");
    window.sessionStorage.setItem(AUTH_SESSION_TOKEN_STORAGE_KEY, "reload-token");
    window.sessionStorage.setItem(AUTH_SESSION_TAB_ID_STORAGE_KEY, currentTabId);
    window.localStorage.setItem(`${AUTH_SESSION_ACTIVE_TAB_STORAGE_KEY_PREFIX}${currentTabId}`, String(Date.now()));

    const { getStoredAuthToken, ensureAuthSessionTabScope } = await loadSessionTokenModule();

    ensureAuthSessionTabScope();

    expect(getStoredAuthToken()).toBe("reload-token");
    expect(window.sessionStorage.getItem(AUTH_SESSION_TAB_ID_STORAGE_KEY)).toBe(currentTabId);
  });
});
