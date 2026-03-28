import { appConfig } from "../config/appConfig";
import { getStoredAuthToken } from "../auth/session-token";

function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${appConfig.apiBaseUrl}${normalizedPath}`;
}

function buildRequest(path, options = {}) {
  const headers = new Headers(options.headers);
  const hasBody = typeof options.body !== "undefined";
  let requestBody = options.body;
  const authToken = getStoredAuthToken();

  if (authToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  if (hasBody && requestBody != null && !(requestBody instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify(requestBody);
  }

  return {
    url: buildApiUrl(path),
    init: {
      method: options.method ?? "GET",
      headers,
      body: requestBody,
      credentials: options.credentials ?? "omit",
      signal: options.signal,
    },
  };
}

async function parseErrorResponse(response) {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const responseData = isJson ? await response.json().catch(() => null) : await response.text().catch(() => "");
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

function extractFileName(contentDisposition) {
  const value = String(contentDisposition ?? "").trim();
  if (!value) {
    return "";
  }

  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const asciiMatch = value.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1] ? asciiMatch[1].trim() : "";
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
  const { url, init } = buildRequest(path, options);
  const response = await fetch(url, init);

  if (!response.ok) {
    await parseErrorResponse(response);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  return isJson ? await response.json().catch(() => null) : await response.text().catch(() => "");
}

export async function apiDownload(path, options = {}) {
  const { url, init } = buildRequest(path, options);
  const response = await fetch(url, init);

  if (!response.ok) {
    await parseErrorResponse(response);
  }

  const blob = await response.blob();

  return {
    blob,
    fileName: extractFileName(response.headers.get("content-disposition")),
    contentType: response.headers.get("content-type") ?? blob.type ?? "application/octet-stream",
  };
}
