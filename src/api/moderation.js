import { apiRequest } from "../lib/http";

export function getModerationDashboard(signal) {
  return apiRequest("/moderation/dashboard", { signal });
}

export function getModerationCompanies(signal) {
  return apiRequest("/moderation/companies", { signal });
}

export function getModerationOpportunities(signal) {
  return apiRequest("/moderation/opportunities", { signal });
}

export function getModerationUsers(signal) {
  return apiRequest("/moderation/users", { signal });
}

export function decideCompanyModeration(companyId, status) {
  return apiRequest(`/moderation/companies/${companyId}/decision`, {
    method: "POST",
    body: { status },
  });
}

export function decideOpportunityModeration(opportunityId, status) {
  return apiRequest(`/moderation/opportunities/${opportunityId}/decision`, {
    method: "POST",
    body: { status },
  });
}
