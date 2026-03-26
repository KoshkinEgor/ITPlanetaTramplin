import { ApiError, apiRequest } from "../lib/http";

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

function normalizeRole(role) {
  switch (role) {
    case "candidate":
    case "applicant":
      return "candidate";
    case "company":
    case "employer":
      return "company";
    case "moderator":
    case "curator":
      return "moderator";
    default:
      return role;
  }
}

export async function getCurrentAuthUser() {
  try {
    return await apiRequest("/auth/me");
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function submitLogin({ role, email, identifier, password }) {
  try {
    const apiRole = normalizeRole(role);

    return await apiRequest("/auth/login", {
      method: "POST",
      body: {
        role: apiRole,
        login: apiRole === "company" ? identifier.trim() : email.trim(),
        password,
      },
    });
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
    const apiRole = normalizeRole(role);

    if (apiRole === "company") {
      return await apiRequest("/auth/register/company", {
        method: "POST",
        body: {
          email: email.trim(),
          password,
          companyName: companyName.trim(),
          inn: inn?.trim() || null,
          verificationData: verificationData ?? null,
          legalAddress: legalAddress?.trim() || null,
        },
      });
    }

    return await apiRequest("/auth/register/candidate", {
      method: "POST",
      body: {
        email: email.trim(),
        password,
        name: displayName.trim(),
        surname: "",
        thirdname: "",
      },
    });
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function confirmEmail({ email, role, code }) {
  try {
    return await apiRequest("/auth/confirm-email", {
      method: "POST",
      body: {
        email: email.trim(),
        role: normalizeRole(role),
        code,
      },
    });
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function resendEmailConfirmation({ email, role }) {
  try {
    return await apiRequest("/auth/resend-confirmation", {
      method: "POST",
      body: {
        email: email.trim(),
        role: normalizeRole(role),
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
