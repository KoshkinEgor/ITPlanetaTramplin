import { apiDownload, apiRequest } from "../lib/http";

export function getModerationDashboard(signal) {
  return apiRequest("/moderation/dashboard", { signal });
}

export function getModerationCompanies(signal) {
  return apiRequest("/moderation/companies", { signal });
}

export function getModerationCompany(companyId, signal) {
  return apiRequest(`/moderation/companies/${companyId}`, { signal });
}

export function downloadModerationCompanyVerificationDocument(companyId) {
  return apiDownload(`/moderation/companies/${companyId}/verification-document`);
}

export function updateModerationCompany(companyId, payload) {
  return apiRequest(`/moderation/companies/${companyId}`, {
    method: "PUT",
    body: payload,
  });
}

export function getModerationOpportunities(signal) {
  return apiRequest("/moderation/opportunities", { signal });
}

export function getModerationOpportunity(opportunityId, signal) {
  return apiRequest(`/moderation/opportunities/${opportunityId}`, { signal });
}

export function updateModerationOpportunity(opportunityId, payload) {
  return apiRequest(`/moderation/opportunities/${opportunityId}`, {
    method: "PUT",
    body: payload,
  });
}

export function getModerationUsers(signal) {
  return apiRequest("/moderation/users", { signal });
}

export function getModerationComplaints(signal) {
  return apiRequest("/moderation/complaints", { signal });
}

export function getModerationUser(userId, signal) {
  return apiRequest(`/moderation/users/${userId}`, { signal });
}

export function updateModerationUser(userId, payload) {
  return apiRequest(`/moderation/users/${userId}`, {
    method: "PUT",
    body: payload,
  });
}

export function getModeratorInvitations(signal) {
  return apiRequest("/moderation/moderator-invitations", { signal });
}

export function createModeratorInvitation(payload) {
  return apiRequest("/moderation/moderator-invitations", {
    method: "POST",
    body: payload,
  });
}

export function decideCompanyModeration(companyId, payload) {
  return apiRequest(`/moderation/companies/${companyId}/decision`, {
    method: "POST",
    body: typeof payload === "string" ? { status: payload } : payload,
  });
}

export function decideOpportunityModeration(opportunityId, payload) {
  return apiRequest(`/moderation/opportunities/${opportunityId}/decision`, {
    method: "POST",
    body: typeof payload === "string" ? { status: payload } : payload,
  });
}

export function decideUserModeration(userId, payload) {
  return apiRequest(`/moderation/users/${userId}/decision`, {
    method: "POST",
    body: typeof payload === "string" ? { status: payload } : payload,
  });
}

export function decideComplaintModeration(complaintId, payload) {
  return apiRequest(`/moderation/complaints/${complaintId}/decision`, {
    method: "POST",
    body: typeof payload === "string" ? { status: payload } : payload,
  });
}

export function getModerationTags(params = {}, signal) {
  const search = new URLSearchParams();
  if (params.query) search.set("query", params.query);
  if (params.status) search.set("status", params.status);
  const suffix = search.toString() ? `?${search}` : "";
  return apiRequest(`/moderation/tags${suffix}`, { signal });
}

export function createModerationTag(payload) {
  return apiRequest("/moderation/tags", { method: "POST", body: payload });
}

export function updateModerationTag(tagId, payload) {
  return apiRequest(`/moderation/tags/${tagId}`, { method: "PUT", body: payload });
}

export function setModerationTagEnabled(tagId, enabled) {
  return apiRequest(`/moderation/tags/${tagId}/${enabled ? "enable" : "disable"}`, { method: "POST" });
}

export function mergeModerationTags(payload) {
  return apiRequest("/moderation/tags/merge", { method: "POST", body: payload });
}

export function getModerationReferences(signal) {
  return apiRequest("/moderation/system/references", { signal });
}

export function createModerationReference(payload) {
  return apiRequest("/moderation/system/references", { method: "POST", body: payload });
}

export function updateModerationReference(referenceId, payload) {
  return apiRequest(`/moderation/system/references/${referenceId}`, { method: "PUT", body: payload });
}

export function getModerationAuditLog(params = {}, signal) {
  const search = new URLSearchParams();
  if (params.query) search.set("query", params.query);
  if (params.entityType && params.entityType !== "all") search.set("entityType", params.entityType);
  const suffix = search.toString() ? `?${search}` : "";
  return apiRequest(`/moderation/audit-log${suffix}`, { signal });
}

export function getModeratorSettings(signal) {
  return apiRequest("/moderation/me/settings", { signal });
}

export function updateModeratorSettings(payload) {
  return apiRequest("/moderation/me/settings", { method: "PUT", body: payload });
}
