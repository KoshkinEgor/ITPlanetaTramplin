import { apiRequest } from "../lib/http";

export function getCompanyProfile(signal) {
  return apiRequest("/company/me", { signal });
}

export function updateCompanyProfile(body) {
  return apiRequest("/company/me", {
    method: "PUT",
    body,
  });
}

export function getCompanyOpportunities(signal) {
  return apiRequest("/company/me/opportunities", { signal });
}

export function getOpportunityApplications(opportunityId, signal) {
  return apiRequest(`/opportunities/${opportunityId}/applications`, { signal });
}

export function updateOpportunityApplicationStatus(opportunityId, applicationId, body) {
  return apiRequest(`/opportunities/${opportunityId}/applications/${applicationId}`, {
    method: "PUT",
    body,
  });
}
