import { appConfig } from "../config/appConfig";

function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${appConfig.apiBaseUrl}${normalizedPath}`;
}

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status ?? 500;
    this.data = data ?? null;
  }
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers);
  const hasBody = typeof options.body !== "undefined";
  let requestBody = options.body;

  if (hasBody && requestBody != null && !(requestBody instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify(requestBody);
  }

  const response = await fetch(buildApiUrl(path), {
    method: options.method ?? "GET",
    headers,
    body: requestBody,
    credentials: "include",
    signal: options.signal,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const responseData = isJson ? await response.json().catch(() => null) : await response.text().catch(() => "");

  if (!response.ok) {
    const errorMessage =
      typeof responseData?.message === "string" && responseData.message.trim()
        ? responseData.message
        : typeof responseData === "string" && responseData.trim()
          ? responseData
          : `Request failed with status ${response.status}`;

    throw new ApiError(errorMessage, {
      status: response.status,
      data: responseData,
    });
  }

  return responseData;
}
