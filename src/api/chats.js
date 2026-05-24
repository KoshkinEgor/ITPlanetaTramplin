import * as signalR from "@microsoft/signalr";
import { routes } from "../app/routes";
import { getStoredAuthToken } from "../auth/session-token";
import { appConfig } from "../config/appConfig";
import { apiRequest } from "../lib/http";

export function getChatThreads(signal) {
  return apiRequest("/chats", { signal });
}

export function getChatThread(threadId, signal) {
  return apiRequest(`/chats/${threadId}`, { signal });
}

export function getChatMessages(threadId, options = {}, signal) {
  const searchParams = new URLSearchParams();
  if (options.take) {
    searchParams.set("take", String(options.take));
  }

  const query = searchParams.toString();
  return apiRequest(`/chats/${threadId}/messages${query ? `?${query}` : ""}`, { signal });
}

export function startChat(body) {
  return apiRequest("/chats/start", {
    method: "POST",
    body,
  });
}

export function sendChatMessage(threadId, body) {
  return apiRequest(`/chats/${threadId}/messages`, {
    method: "POST",
    body,
  });
}

export function markChatRead(threadId) {
  return apiRequest(`/chats/${threadId}/read`, {
    method: "POST",
  });
}

export function getMessagesRouteForRole(role) {
  switch (role) {
    case "company":
      return routes.company.messages;
    case "moderator":
      return routes.moderator.messages;
    case "candidate":
      return routes.candidate.messages;
    default:
      return routes.home;
  }
}

function buildHubUrl() {
  const apiBaseUrl = appConfig.apiBaseUrl.replace(/\/+$/, "");
  if (/^https?:\/\//i.test(apiBaseUrl)) {
    return apiBaseUrl.replace(/\/api$/i, "/hubs/chat");
  }

  return "/hubs/chat";
}

export function createChatConnection() {
  return new signalR.HubConnectionBuilder()
    .withUrl(buildHubUrl(), {
      accessTokenFactory: () => getStoredAuthToken() ?? "",
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}
