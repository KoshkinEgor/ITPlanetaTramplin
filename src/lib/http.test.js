import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiDownload, apiRequest } from "./http";
import { clearStoredAuthToken, setStoredAuthToken } from "../auth/session-token";

afterEach(() => {
  vi.restoreAllMocks();
  clearStoredAuthToken();
});

describe("apiRequest", () => {
  it("sends JSON requests with bearer auth from sessionStorage", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => "application/json",
      },
      json: async () => ({ ok: true }),
      text: async () => "",
    });

    vi.stubGlobal("fetch", fetchMock);
    setStoredAuthToken("window-token");

    await expect(
      apiRequest("/auth/login", {
        method: "POST",
        body: { email: "team@tramplin.local" },
      })
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        credentials: "omit",
        headers: expect.any(Headers),
        method: "POST",
      })
    );

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(requestInit.headers.get("Authorization")).toBe("Bearer window-token");
    expect(requestInit.headers.get("Content-Type")).toBe("application/json");
  });

  it("throws ApiError with backend message payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        headers: {
          get: () => "application/json",
        },
        json: async () => ({ message: "Already exists" }),
        text: async () => "",
      })
    );

    await expect(apiRequest("/registration/applicant")).rejects.toEqual(
      expect.objectContaining({
        name: "ApiError",
        message: "Already exists",
        status: 409,
      })
    );
  });

  it("keeps ApiError type for consumers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        headers: {
          get: () => "text/plain",
        },
        json: async () => null,
        text: async () => "Request failed",
      })
    );

    try {
      await apiRequest("/health");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
    }
  });

  it("does not attach Authorization when the window has no auth token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => "application/json",
      },
      json: async () => ({ ok: true }),
      text: async () => "",
    });

    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/health");

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(requestInit.headers.get("Authorization")).toBeNull();
  });

  it("downloads binary responses with auth and filename metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (name) => {
          if (name === "content-type") {
            return "application/pdf";
          }

          if (name === "content-disposition") {
            return 'attachment; filename="egrul.pdf"';
          }

          return null;
        },
      },
      blob: async () => new Blob(["pdf"], { type: "application/pdf" }),
      json: async () => null,
      text: async () => "",
    });

    vi.stubGlobal("fetch", fetchMock);
    setStoredAuthToken("window-token");

    await expect(apiDownload("/company/me/verification-document")).resolves.toEqual(
      expect.objectContaining({
        fileName: "egrul.pdf",
        contentType: "application/pdf",
      })
    );

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(requestInit.headers.get("Authorization")).toBe("Bearer window-token");
  });
});
