import { apiRequest } from "../lib/http";

export function getNotifications(options = {}, signal) {
  const searchParams = new URLSearchParams();

  if (options?.unreadOnly) {
    searchParams.set("unreadOnly", "true");
  }

  const query = searchParams.toString();
  return apiRequest(`/notifications${query ? `?${query}` : ""}`, { signal });
}

export function markNotificationRead(notificationId) {
  return apiRequest(`/notifications/${notificationId}/read`, {
    method: "POST",
  });
}

export function markAllNotificationsRead() {
  return apiRequest("/notifications/read-all", {
    method: "POST",
  });
}
