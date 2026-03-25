import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "./http";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("apiRequest", () => {
  it("sends JSON requests with credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => "application/json",
      },
      json: async () => ({ ok: true }),
      text: async () => "",
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiRequest("/auth/login", {
        method: "POST",
        body: { email: "team@tramplin.local" },
      })
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        credentials: "include",
        method: "POST",
      })
    );
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
});
