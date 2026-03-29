import { apiRequest } from "../lib/http";

export function getCandidateProfile(signal) {
  return apiRequest("/candidate/me", { signal });
}

export function updateCandidateProfile(body) {
  return apiRequest("/candidate/me", {
    method: "PUT",
    body,
  });
}

export function getCandidateEducation(signal) {
  return apiRequest("/candidate/me/education", { signal });
}

export function createCandidateEducation(body) {
  return apiRequest("/candidate/me/education", {
    method: "POST",
    body,
  });
}

export function updateCandidateEducation(educationId, body) {
  return apiRequest(`/candidate/me/education/${educationId}`, {
    method: "PUT",
    body,
  });
}

export function deleteCandidateEducation(educationId) {
  return apiRequest(`/candidate/me/education/${educationId}`, {
    method: "DELETE",
  });
}

export function getCandidateAchievements(signal) {
  return apiRequest("/candidate/me/achievements", { signal });
}

export function createCandidateAchievement(body) {
  return apiRequest("/candidate/me/achievements", {
    method: "POST",
    body,
  });
}

export function updateCandidateAchievement(achievementId, body) {
  return apiRequest(`/candidate/me/achievements/${achievementId}`, {
    method: "PUT",
    body,
  });
}

export function deleteCandidateAchievement(achievementId) {
  return apiRequest(`/candidate/me/achievements/${achievementId}`, {
    method: "DELETE",
  });
}

export function getCandidateProjects(signal) {
  return apiRequest("/candidate/me/projects", { signal });
}

export function createCandidateProject(body) {
  return apiRequest("/candidate/me/projects", {
    method: "POST",
    body,
  });
}

export function updateCandidateProject(projectId, body) {
  return apiRequest(`/candidate/me/projects/${projectId}`, {
    method: "PUT",
    body,
  });
}

export function deleteCandidateProject(projectId) {
  return apiRequest(`/candidate/me/projects/${projectId}`, {
    method: "DELETE",
  });
}

export function getCandidateApplications(signal) {
  return apiRequest("/candidate/me/applications", { signal });
}

export function withdrawCandidateApplication(applicationId) {
  return apiRequest(`/candidate/me/applications/${applicationId}/withdraw`, {
    method: "POST",
  });
}

export function confirmCandidateApplication(applicationId) {
  return apiRequest(`/candidate/me/applications/${applicationId}/confirm`, {
    method: "POST",
  });
}

export function getCandidateContacts(signal) {
  return apiRequest("/candidate/me/contacts", { signal });
}

export function getCandidateDirectory(signal) {
  return apiRequest("/candidate/me/directory", { signal });
}

export function createCandidateContact(body) {
  return apiRequest("/candidate/me/contacts", {
    method: "POST",
    body,
  });
}

export function deleteCandidateContact(contactId) {
  return apiRequest(`/candidate/me/contacts/${contactId}`, {
    method: "DELETE",
  });
}

export function getCandidateFriends(signal) {
  return apiRequest("/candidate/me/friends", { signal });
}

export function deleteCandidateFriend(userId) {
  return apiRequest(`/candidate/me/friends/${userId}`, {
    method: "DELETE",
  });
}

export function getCandidateFriendRequests(signal) {
  return apiRequest("/candidate/me/friends/requests", { signal });
}

export function createCandidateFriendRequest(body) {
  return apiRequest("/candidate/me/friends/requests", {
    method: "POST",
    body,
  });
}

export function acceptCandidateFriendRequest(requestId) {
  return apiRequest(`/candidate/me/friends/requests/${requestId}/accept`, {
    method: "POST",
  });
}

export function declineCandidateFriendRequest(requestId) {
  return apiRequest(`/candidate/me/friends/requests/${requestId}/decline`, {
    method: "POST",
  });
}

export function cancelCandidateFriendRequest(requestId) {
  return apiRequest(`/candidate/me/friends/requests/${requestId}/cancel`, {
    method: "POST",
  });
}

export function getCandidateProjectInvites(signal) {
  return apiRequest("/candidate/me/project-invites", { signal });
}

export function createCandidateProjectInvite(body) {
  return apiRequest("/candidate/me/project-invites", {
    method: "POST",
    body,
  });
}

export function acceptCandidateProjectInvite(inviteId) {
  return apiRequest(`/candidate/me/project-invites/${inviteId}/accept`, {
    method: "POST",
  });
}

export function declineCandidateProjectInvite(inviteId) {
  return apiRequest(`/candidate/me/project-invites/${inviteId}/decline`, {
    method: "POST",
  });
}

export function cancelCandidateProjectInvite(inviteId) {
  return apiRequest(`/candidate/me/project-invites/${inviteId}/cancel`, {
    method: "POST",
  });
}

export function getCandidateOpportunityShares(box = "all", signal) {
  const searchParams = new URLSearchParams();

  if (typeof box === "string" && box.trim() && box.trim().toLowerCase() !== "all") {
    searchParams.set("box", box.trim().toLowerCase());
  }

  const query = searchParams.toString();
  return apiRequest(`/candidate/me/opportunity-shares${query ? `?${query}` : ""}`, { signal });
}

export function createCandidateOpportunityShare(body) {
  return apiRequest("/candidate/me/opportunity-shares", {
    method: "POST",
    body,
  });
}

export function getCandidateContactSuggestions(options = {}, signal) {
  const searchParams = new URLSearchParams();
  const source = typeof options?.source === "string" ? options.source.trim().toLowerCase() : "";
  const limit = Number(options?.limit);

  if (source) {
    searchParams.set("source", source);
  }

  if (Number.isFinite(limit) && limit > 0) {
    searchParams.set("limit", String(Math.round(limit)));
  }

  const query = searchParams.toString();
  return apiRequest(`/candidate/me/contact-suggestions${query ? `?${query}` : ""}`, { signal });
}

export function getCandidateOpportunitySocialContext(opportunityId, signal) {
  return apiRequest(`/candidate/opportunities/${opportunityId}/social-context`, { signal });
}

export function getCandidatePublicProfile(userId, signal) {
  return apiRequest(`/candidate/public/${userId}`, { signal });
}

export function getCandidateRecommendations(signal) {
  return apiRequest("/candidate/me/recommendations", { signal });
}

export function createCandidateRecommendation(body) {
  return apiRequest("/candidate/me/recommendations", {
    method: "POST",
    body,
  });
}
