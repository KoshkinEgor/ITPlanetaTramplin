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

export function decideCompanyModeration(companyId, status) {
  return apiRequest(`/moderation/companies/${companyId}/decision`, {
    method: "POST",
    body: { status },
  });
}

export function decideOpportunityModeration(opportunityId, payload) {
  return apiRequest(`/moderation/opportunities/${opportunityId}/decision`, {
    method: "POST",
    body: typeof payload === "string" ? { status: payload } : payload,
  });
}

export function decideUserModeration(userId, status) {
  return apiRequest(`/moderation/users/${userId}/decision`, {
    method: "POST",
    body: { status },
  });
}
