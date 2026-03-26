import { afterEach, describe, expect, it, vi } from "vitest";
import {
  confirmEmail,
  lookupEmployerInn,
  requestPasswordReset,
  resendEmailConfirmation,
  submitLogin,
  submitPasswordReset,
  submitRegistration,
} from "./api";
import { apiRequest } from "../lib/http";

vi.mock("../lib/http", () => ({
  ApiError: class ApiError extends Error {},
  apiRequest: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("auth api", () => {
  it("uses canonical login route with normalized company role", async () => {
    apiRequest.mockResolvedValue({ ok: true });

    await submitLogin({
      role: "employer",
      inn: "1234567890",
      email: "",
      password: "Password1",
    });

    expect(apiRequest).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: {
        role: "company",
        login: "1234567890",
        password: "Password1",
      },
    });
  });

  it("normalizes curator login to moderator api role", async () => {
    apiRequest.mockResolvedValue({ ok: true });

    await submitLogin({
      role: "curator",
      inn: "",
      email: "demo-curator@tramplin.local",
      password: "Curator1234",
    });

    expect(apiRequest).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: {
        role: "moderator",
        login: "demo-curator@tramplin.local",
        password: "Curator1234",
      },
    });
  });

  it("uses canonical registration and confirm routes", async () => {
    apiRequest.mockResolvedValue({ ok: true });

    await submitRegistration({
      role: "candidate",
      email: "candidate@tramplin.local",
      password: "Password1",
      displayName: "Candidate",
    });

    await confirmEmail({
      email: "candidate@tramplin.local",
      role: "applicant",
      code: "1234",
    });

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/auth/register/candidate", {
      method: "POST",
      body: {
        email: "candidate@tramplin.local",
        password: "Password1",
        name: "Candidate",
        surname: "",
        thirdname: "",
      },
    });

    expect(apiRequest).toHaveBeenNthCalledWith(2, "/auth/confirm-email", {
      method: "POST",
      body: {
        email: "candidate@tramplin.local",
        role: "candidate",
        code: "1234",
      },
    });
  });

  it("omits company email for inn-based registration", async () => {
    apiRequest.mockResolvedValue({ ok: true });

    await submitRegistration({
      role: "employer",
      password: "Password1",
      companyName: "Sever Co",
      inn: "5408114123",
      legalAddress: "Novosibirsk",
    });

    expect(apiRequest).toHaveBeenCalledWith("/auth/register/company", {
      method: "POST",
      body: {
        password: "Password1",
        companyName: "Sever Co",
        inn: "5408114123",
        verificationData: null,
        legalAddress: "Novosibirsk",
      },
    });
  });

  it("uses canonical password reset and inn lookup routes", async () => {
    apiRequest.mockResolvedValue({ ok: true });

    await resendEmailConfirmation({
      email: "company@tramplin.local",
      role: "employer",
    });

    await lookupEmployerInn("1234567890");
    await requestPasswordReset({ email: "company@tramplin.local" });
    await submitPasswordReset({
      email: "company@tramplin.local",
      code: "123456",
      password: "NewPassword1",
    });

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/auth/resend-confirmation", {
      method: "POST",
      body: {
        email: "company@tramplin.local",
        role: "company",
      },
    });
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/auth/register/company/lookup-inn/1234567890");
    expect(apiRequest).toHaveBeenNthCalledWith(3, "/auth/forgot-password", {
      method: "POST",
      body: {
        email: "company@tramplin.local",
      },
    });
    expect(apiRequest).toHaveBeenNthCalledWith(4, "/auth/reset-password", {
      method: "POST",
      body: {
        email: "company@tramplin.local",
        code: "123456",
        password: "NewPassword1",
      },
    });
  });
});
