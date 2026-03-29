import { apiRequest } from "../lib/http";

export function getOpportunities(signal) {
  return apiRequest("/opportunities", { signal });
}

export function getOpportunity(opportunityId, signal) {
  return apiRequest(`/opportunities/${opportunityId}`, { signal });
}

export function createOpportunity(body) {
  return apiRequest("/opportunities", {
    method: "POST",
    body,
  });
}

export function updateOpportunity(opportunityId, body) {
  return apiRequest(`/opportunities/${opportunityId}`, {
    method: "PUT",
    body,
  });
}

export function deleteOpportunity(opportunityId) {
  return apiRequest(`/opportunities/${opportunityId}`, {
    method: "DELETE",
  });
}

export function applyToOpportunity(opportunityId, body = {}) {
  return apiRequest(`/opportunities/${opportunityId}/applications`, {
    method: "POST",
    body,
  });
}
