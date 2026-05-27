import { apiDownload, apiRequest } from "../lib/http";

export function getCompanyProfile(signal) {
  return apiRequest("/company/me", { signal });
}

export function getCompanyDirectory(signal) {
  return apiRequest("/company/me/directory", { signal });
}

export function updateCompanyProfile(body) {
  return apiRequest("/company/me", {
    method: "PUT",
    body,
  });
}

export function getCompanySettings(signal) {
  return apiRequest("/company/me/settings", { signal });
}

export function updateCompanySettings(body) {
  return apiRequest("/company/me/settings", {
    method: "PUT",
    body,
  });
}

export function submitCompanyVerificationRequest(body) {
  return apiRequest("/company/me/verification-request", {
    method: "POST",
    body,
  });
}

export function downloadCompanyVerificationDocument() {
  return apiDownload("/company/me/verification-document");
}

export function getCompanyOpportunities(signal) {
  return apiRequest("/company/me/opportunities", { signal });
}

export function getPublicCompany(companyId, signal) {
  return apiRequest(`/companies/${companyId}`, { signal });
}

export function getPublicCompanyOpportunities(companyId, signal) {
  return apiRequest(`/companies/${companyId}/opportunities`, { signal });
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

export function cancelAcceptedOpportunityApplication(opportunityId, applicationId, body) {
  return apiRequest(`/opportunities/${opportunityId}/applications/${applicationId}/cancel-accepted`, {
    method: "POST",
    body,
  });
}
