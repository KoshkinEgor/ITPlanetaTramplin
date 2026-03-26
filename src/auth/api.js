import { useEffect, useSyncExternalStore } from "react";
import { ApiError, apiRequest } from "../lib/http";
import { normalizeAuthRole } from "./session-utils";

function mapApiError(error) {
  if (error instanceof ApiError) {
    if (typeof error.data?.message === "string" && error.data.message.trim()) {
      return new ApiError(error.data.message, {
        status: error.status,
        data: error.data,
      });
    }

    if (typeof error.message === "string" && error.message.trim()) {
      return error;
    }
  }

  return error;
}

function normalizeAuthUser(user) {
  if (!user || typeof user !== "object") {
    return null;
  }

  return {
    ...user,
    role: normalizeAuthRole(user.role),
  };
}

function isUnauthorized(error) {
  const status = error instanceof ApiError ? error.status : error?.status;
  return status === 401 || status === 403;
}

let authSessionSnapshot = {
  status: "idle",
  user: null,
  error: null,
};

let authSessionRequest = null;

const authSessionListeners = new Set();

function emitAuthSessionChange() {
  authSessionListeners.forEach((listener) => listener());
}

function setAuthSessionSnapshot(nextSnapshot) {
  authSessionSnapshot = nextSnapshot;
  emitAuthSessionChange();
}

function setAuthSessionLoading() {
  if (authSessionSnapshot.status === "loading") {
    return;
  }

  setAuthSessionSnapshot({
    status: "loading",
    user: authSessionSnapshot.user,
    error: null,
  });
}

function captureAuthenticatedUser(result) {
  if (result?.user) {
    setAuthenticatedSession(result.user);
  }
}

export function getAuthSessionSnapshot() {
  return authSessionSnapshot;
}

export function subscribeAuthSession(listener) {
  authSessionListeners.add(listener);

  return () => {
    authSessionListeners.delete(listener);
  };
}

export function setAuthenticatedSession(user) {
  const normalizedUser = normalizeAuthUser(user);

  if (!normalizedUser) {
    return null;
  }

  setAuthSessionSnapshot({
    status: "authenticated",
    user: normalizedUser,
    error: null,
  });

  return normalizedUser;
}

export function clearAuthSession() {
  authSessionRequest = null;

  setAuthSessionSnapshot({
    status: "guest",
    user: null,
    error: null,
  });
}

export async function refreshAuthSession({ force = false } = {}) {
  if (!force) {
    if (authSessionSnapshot.status === "authenticated") {
      return authSessionSnapshot.user;
    }

    if (authSessionSnapshot.status === "guest") {
      throw new ApiError("Unauthorized", { status: 401 });
    }

    if (authSessionRequest) {
      return authSessionRequest;
    }
  }

  setAuthSessionLoading();

  authSessionRequest = (async () => {
    try {
      const user = normalizeAuthUser(await apiRequest("/auth/me"));
      return setAuthenticatedSession(user);
    } catch (error) {
      const mappedError = mapApiError(error);

      if (isUnauthorized(mappedError)) {
        clearAuthSession();
      } else {
        setAuthSessionSnapshot({
          status: "error",
          user: null,
          error: mappedError,
        });
      }

      throw mappedError;
    } finally {
      authSessionRequest = null;
    }
  })();

  return authSessionRequest;
}

export function useAuthSession({ autoRefresh = true } = {}) {
  const snapshot = useSyncExternalStore(subscribeAuthSession, getAuthSessionSnapshot, getAuthSessionSnapshot);

  useEffect(() => {
    if (!autoRefresh || snapshot.status !== "idle") {
      return;
    }

    void refreshAuthSession().catch(() => {});
  }, [autoRefresh, snapshot.status]);

  return snapshot;
}

export async function getCurrentAuthUser() {
  try {
    return await refreshAuthSession({ force: true });
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function submitLogin({ role, email, inn, password }) {
  try {
    const apiRole = normalizeAuthRole(role);

    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        role: apiRole,
        login: apiRole === "company" ? inn.trim() : email.trim(),
        password,
      },
    });

    captureAuthenticatedUser(result);
    return result;
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function submitRegistration({
  role,
  email,
  password,
  displayName,
  companyName,
  inn,
  verificationData,
  legalAddress,
}) {
  try {
    const apiRole = normalizeAuthRole(role);

    if (apiRole === "company") {
      const result = await apiRequest("/auth/register/company", {
        method: "POST",
        body: {
          email: email?.trim() || undefined,
          password,
          companyName: companyName.trim(),
          inn: inn?.trim() || null,
          verificationData: verificationData ?? null,
          legalAddress: legalAddress?.trim() || null,
        },
      });

      captureAuthenticatedUser(result);
      return result;
    }

    const result = await apiRequest("/auth/register/candidate", {
      method: "POST",
      body: {
        email: email.trim(),
        password,
        name: displayName.trim(),
        surname: "",
        thirdname: "",
      },
    });

    captureAuthenticatedUser(result);
    return result;
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function confirmEmail({ email, role, code }) {
  try {
    const result = await apiRequest("/auth/confirm-email", {
      method: "POST",
      body: {
        email: email.trim(),
        role: normalizeAuthRole(role),
        code,
      },
    });

    captureAuthenticatedUser(result);
    return result;
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function logoutCurrentAuthUser() {
  try {
    const result = await apiRequest("/auth/logout", {
      method: "POST",
    });

    clearAuthSession();
    return result;
  } catch (error) {
    const mappedError = mapApiError(error);

    if (isUnauthorized(mappedError)) {
      clearAuthSession();
      return { message: "" };
    }

    throw mappedError;
  }
}

export async function resendEmailConfirmation({ email, role }) {
  try {
    return await apiRequest("/auth/resend-confirmation", {
      method: "POST",
      body: {
        email: email.trim(),
        role: normalizeAuthRole(role),
      },
    });
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function lookupEmployerInn(inn) {
  try {
    return await apiRequest(`/auth/register/company/lookup-inn/${encodeURIComponent(inn.trim())}`);
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function requestPasswordReset({ email }) {
  try {
    return await apiRequest("/auth/forgot-password", {
      method: "POST",
      body: {
        email: email.trim(),
      },
    });
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function submitPasswordReset({ email, code, password }) {
  try {
    return await apiRequest("/auth/reset-password", {
      method: "POST",
      body: {
        email: email.trim(),
        code,
        password,
      },
    });
  } catch (error) {
    throw mapApiError(error);
  }
}

export const confirmEmailVerification = confirmEmail;
export const resendEmailVerification = resendEmailConfirmation;
